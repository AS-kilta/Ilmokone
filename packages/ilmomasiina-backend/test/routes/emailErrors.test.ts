import { describe, expect, test } from "vitest";

import type { AdminEventResponse } from "@tietokilta/ilmomasiina-models";
import sendSignupConfirmationMail from "../../src/mail/signupConfirmation";
import { Signup } from "../../src/models/signup";
import { refreshSignupPositions } from "../../src/routes/signups/computeSignupPosition";
import { testEvent, testSignups } from "../testData";

async function fetchAdminEventDetails(event: { id: string }) {
  const response = await server.inject({
    method: "GET",
    url: `/api/admin/events/${event.id}`,
    headers: { authorization: adminToken },
  });
  return [response.json<AdminEventResponse>(), response] as const;
}

describe("email error handling", () => {
  test("records email error on signup when mail server rejects confirmation email", async () => {
    const event = await testEvent();
    const [signup] = await testSignups(event, { count: 1, confirmed: true });

    // Mock EmailService.send to simulate an SMTP rejection error (e.g. from Google SMTP)
    const smtpError = new Error("550-5.1.1 The email account that you tried to reach does not exist.");
    global.emailSend.mockRejectedValueOnce(smtpError);

    await sendSignupConfirmationMail(signup, "signup", false);

    const reloaded = await Signup.findByPk(signup.id);
    expect(reloaded!.emailError).toBe(smtpError.message);

    // Verify that the error is exposed in the admin event details endpoint
    const [adminData, response] = await fetchAdminEventDetails(event);
    expect(response.statusCode).toBe(200);

    const quota = adminData.quotas.find((q) => q.id === signup.quotaId);
    expect(quota).toBeTruthy();
    const adminSignup = quota!.signups.find((s) => s.id === signup.id);
    expect(adminSignup).toBeTruthy();
    expect(adminSignup!.emailError).toBe(smtpError.message);
  });

  test("clears email error on signup when confirmation email subsequently succeeds", async () => {
    const event = await testEvent();
    const [signup] = await testSignups(event, { count: 1, confirmed: true });

    // Set an initial email error
    await signup.update({ emailError: "Previous delivery failure" });

    // Mock EmailService.send to succeed
    global.emailSend.mockResolvedValueOnce(undefined);

    await sendSignupConfirmationMail(signup, "edit", false);

    const reloaded = await Signup.findByPk(signup.id);
    expect(reloaded!.emailError).toBe(null);

    // Verify admin details shows cleared error
    const [adminData] = await fetchAdminEventDetails(event);
    const quota = adminData.quotas.find((q) => q.id === signup.quotaId);
    const adminSignup = quota!.signups.find((s) => s.id === signup.id);
    expect(adminSignup!.emailError).toBe(null);
  });

  test("handles queue promotion email error and stores it on signup", async () => {
    const event = await testEvent({ quotaCount: 1, quotaOverrides: { size: 1 } }, { openQuotaSize: 0 });
    // Create 2 signups: first in quota, second in queue
    const [first] = await testSignups(
      event,
      { count: 1, confirmed: true },
      { createdAt: new Date(Date.now() - 60000) },
    );
    const [second] = await testSignups(
      event,
      { count: 1, confirmed: true },
      { createdAt: new Date(Date.now() - 30000) },
    );
    await refreshSignupPositions(event);

    const reloadedSecond = await Signup.findByPk(second.id);
    expect(reloadedSecond!.status).toBe("in-queue");

    // Mock error for when queue promotion email is sent
    const authError = new Error("Invalid login: 535-5.7.8 Username and Password not accepted");
    global.emailSend.mockRejectedValueOnce(authError);

    // Delete the first signup, which triggers queue promotion for the second
    await first.destroy();
    await refreshSignupPositions(event);

    const promoted = await Signup.findByPk(second.id);
    expect(promoted!.status).toBe("in-quota");
    expect(promoted!.emailError).toBe(authError.message);
  });
});
