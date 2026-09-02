import { describe, expect, test, vi } from "vitest";

import EmailService from "../../src/mail";
import mailTransporter from "../../src/mail/config";
import { renderVectorSvg, vectorText } from "../../src/mail/vectorText";

describe("EmailService", () => {
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

  test("renders confirmation email preview with inlined styles and vector text", async () => {
    const previewHtml = await EmailService.createConfirmationEmailPreview("fi", sampleParams);
    expect(previewHtml).toBeDefined();
    expect(previewHtml).toContain("Testitapahtuma");
    expect(previewHtml).toContain("Teemu Teekkari");
    expect(previewHtml).toContain("Otaniemi");
    expect(previewHtml).toContain("Tervetuloa tapahtumaan!");
    // Check that vector images for header and alert are rendered
    expect(previewHtml).toContain("data:image/svg+xml;base64,");
    expect(previewHtml).toContain("AS Ilmokone");
    expect(previewHtml).toContain("Ei vissii mikää neliö...");
  });

  test("vectorText and renderVectorSvg generate valid vector SVG data", () => {
    const svg = renderVectorSvg("AS Ilmokone", { font: "anta", fontSize: 48, color: "#ffffff" });
    expect(svg).toContain("<svg xmlns=");
    expect(svg).toContain("<path d=");
    expect(svg).toContain("#ffffff");

    const img = vectorText("AS Ilmokone", { font: "anta", fontSize: 48, color: "#ffffff" });
    expect(img).toContain("<img src=");
    expect(img).toContain("data:image/svg+xml;base64,");
    expect(img).toContain("AS Ilmokone");
  });

  test("sendConfirmationMail sends rendered email and rethrows on error", async () => {
    const error = new Error("550 5.4.5 Daily user sending limit exceeded");
    global.emailSend.mockRejectedValueOnce(error);

    await expect(EmailService.sendConfirmationMail("teemu@example.com", "fi", sampleParams)).rejects.toThrow(
      "550 5.4.5 Daily user sending limit exceeded",
    );
  });

  test("sendNewUserMail sends invitation email and rethrows on error", async () => {
    const error = new Error("Invalid login: 535-5.7.8 Username and Password not accepted");
    global.emailSend.mockRejectedValueOnce(error);

    await expect(
      EmailService.sendNewUserMail("newuser@example.com", "fi", {
        email: "newuser@example.com",
        password: "TemporaryPassword123",
      }),
    ).rejects.toThrow("Invalid login: 535-5.7.8 Username and Password not accepted");
  });

  test("sendPromotedFromQueueMail sends promotion email and rethrows on error", async () => {
    const error = new Error("ESOCKET: wrong version number");
    global.emailSend.mockRejectedValueOnce(error);

    await expect(
      EmailService.sendPromotedFromQueueMail("teemu@example.com", "fi", {
        event: sampleParams.event,
        date: sampleParams.date,
      }),
    ).rejects.toThrow("ESOCKET: wrong version number");
  });

  test("EmailService.send invokes mailTransporter.sendMail", async () => {
    const sendMailSpy = vi.spyOn(mailTransporter, "sendMail").mockResolvedValueOnce({} as any);

    // Call the actual unmocked implementation
    await global.emailSend.getMockImplementation()?.("test@example.com", "Subject", "<p>Hello</p>");
    // Or call EmailService.send when unmocked
    global.emailSend.mockRestore();
    await EmailService.send("test@example.com", "Subject", "<p>Hello</p>");

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Subject",
        html: "<p>Hello</p>",
      }),
    );
    sendMailSpy.mockRestore();
    // Re-establish setup mock
    global.emailSend = vi.spyOn(EmailService, "send").mockImplementation(async () => {});
  });
});
