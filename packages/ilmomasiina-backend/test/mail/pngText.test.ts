import { describe, expect, test } from "vitest";

import EmailService from "../../src/mail";
import { getOrRenderPng, renderPngCidImg, renderPngDataUriImg } from "../../src/mail/pngText";

describe("pngText and EmailService PNG/CID delivery", () => {
  test("getOrRenderPng generates valid PNG buffer and dimensions", () => {
    const png = getOrRenderPng("AS Ilmokone", { font: "anta", fontSize: 48, color: "#ffffff" });
    expect(png.buffer).toBeInstanceOf(Buffer);
    expect(png.buffer.length).toBeGreaterThan(100);
    // PNG magic bytes
    expect(png.buffer[0]).toBe(0x89);
    expect(png.buffer[1]).toBe(0x50); // P
    expect(png.buffer[2]).toBe(0x4e); // N
    expect(png.buffer[3]).toBe(0x47); // G
    expect(png.width).toBeGreaterThan(0);
    expect(png.height).toBeGreaterThan(0);
    expect(png.dataUri).toContain("data:image/png;base64,");
  });

  test("renderPngDataUriImg and renderPngCidImg output proper img tags", () => {
    const dataImg = renderPngDataUriImg("Nollasana salattu", { font: "jacquard", fontSize: 34, color: "#ffffff" });
    expect(dataImg).toContain("data:image/png;base64,");
    expect(dataImg).toContain("Nollasana salattu");

    const cidImg = renderPngCidImg("Nollasana salattu", "img_1", { font: "jacquard", fontSize: 34, color: "#ffffff" });
    expect(cidImg).toContain("cid:img_1");
    expect(cidImg).toContain("Nollasana salattu");
  });

  test("createConfirmationEmailPreview renders base64 PNGs for browser preview", async () => {
    const sampleParams = {
      name: "Teemu Teekkari",
      email: "teemu@example.com",
      quota: "Jäsenet",
      answers: [{ label: "Erityisruokavalio", answer: "Gluteeniton" }],
      queuePosition: null,
      type: "signup" as const,
      admin: false,
      date: "10.10.2026",
      event: {
        title: "Testitapahtuma",
        location: "Otaniemi",
        verificationEmail: "Tervetuloa tapahtumaan!",
      },
      cancelLink: "https://ilmo.example.com/edit/123",
    };

    const previewHtml = await EmailService.createConfirmationEmailPreview("fi", sampleParams);
    expect(previewHtml).toBeDefined();
    expect(previewHtml).toContain("data:image/png;base64,");
    expect(previewHtml).toContain("AS Ilmokone");
    expect(previewHtml).toContain("Ei vissii mikää neliö...");
  });

  test("sendResetPasswordMail attaches PNGs as CID attachments for universal client rendering", async () => {
    await EmailService.sendResetPasswordMail("user@example.com", "fi", {
      email: "user@example.com",
      password: "TestPassword123",
    });

    expect(global.emailSend).toHaveBeenCalledTimes(1);
    const [to, subject, html, attachments] = global.emailSend.mock.calls[0];
    expect(to).toBe("user@example.com");
    expect(subject).toBe("Salasanasi AS Ilmokoneeseen on nollattu");
    expect(html).toContain("cid:img_");
    expect(attachments).toBeDefined();
    expect(attachments.length).toBeGreaterThanOrEqual(1);
    expect(attachments[0]).toMatchObject({
      contentType: "image/png",
    });
    expect(attachments[0].filename).toMatch(/^img_\d+\.png$/);
    expect(attachments[0].cid).toMatch(/^img_\d+$/);
    expect(attachments[0].content).toBeInstanceOf(Buffer);
  });

  test("renders full phrases with punctuation without truncation or NaN corruption", () => {
    const phrases = [
      "Ei vissii mikää neliö...",
      "Not a square, I see!",
      "Pitkä oli jonottajan pinna!",
      "Queueing is a virtue.",
      "Kaikki tämä voima, sinun käsissäsi?!",
      "All this power, in your hands?!",
      "Nollasana salattu",
      "Password reset is, or is?",
      "AS Ilmokone",
    ];

    for (const phrase of phrases) {
      const font = phrase === "AS Ilmokone" ? "anta" : "jacquard";
      const png = getOrRenderPng(phrase, { font, fontSize: 34, color: "#ffffff" });
      expect(png.buffer).toBeInstanceOf(Buffer);
      expect(png.buffer.length).toBeGreaterThan(1000);
      expect(png.width).toBeGreaterThan(50);
      expect(png.height).toBeGreaterThan(20);
      expect(png.dataUri).not.toContain("NaN");
    }
  }, 30000);
});
