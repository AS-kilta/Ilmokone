import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import mailgun from "nodemailer-mailgun-transport";

import config from "../config";

const mailTransporter: Transporter = (() => {
  if (config.mailgunApiKey) {
    if (!config.mailgunDomain) {
      throw new Error("Invalid email config: MAILGUN_DOMAIN must be set with MAILGUN_API_KEY.");
    }
    if (!config.mailFrom) {
      console.warn("MAIL_FROM is not set. Outgoing emails may fail or be rejected by recipient mail servers.");
    }
    return nodemailer.createTransport(
      mailgun({
        auth: {
          api_key: config.mailgunApiKey,
          domain: config.mailgunDomain,
        },
        host: config.mailgunHost,
      }),
    );
  }

  if (config.smtpHost) {
    if (!config.mailFrom) {
      console.warn("MAIL_FROM is not set. Outgoing emails may fail or be rejected by recipient mail servers.");
    }

    const hasOAuth = Boolean(config.googleClientId || config.googleRefreshToken || config.googleClientSecret);

    if (hasOAuth) {
      if (!config.googleClientId || !config.googleRefreshToken) {
        console.warn(
          "Partial Google OAuth credentials configured for SMTP. Both GOOGLE_CLIENT_ID and GOOGLE_REFRESH_TOKEN are required for OAuth2.",
        );
      }
      if (config.googleClientId && config.googleRefreshToken) {
        if (!config.smtpUser) {
          throw new Error("Invalid email config: SMTP_USER must be set when using Google OAuth with SMTP_HOST.");
        }
        return nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort ?? undefined,
          secure: config.smtpTls,
          pool: true,
          auth: {
            type: "OAuth2",
            user: config.smtpUser,
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret ?? undefined,
            refreshToken: config.googleRefreshToken,
          },
        } as SMTPTransport.Options);
      }
    }

    if (!config.smtpUser || !config.smtpPassword) {
      throw new Error("Invalid email config: SMTP_USER and SMTP_PASSWORD must be set with SMTP_HOST.");
    }
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort ?? undefined,
      secure: config.smtpTls,
      pool: true,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    } as SMTPTransport.Options);
  }

  console.warn("Neither Mailgun nor SMTP is configured. Falling back to debug mail service (emails will be logged to console and not sent).");
  return nodemailer.createTransport({
    name: "debug mail service",
    version: "0",
    send(mail, callback?) {
      const { message } = mail;
      const envelope = message.getEnvelope();
      const messageId = message.messageId();
      const input = message.createReadStream();
      let data = "";
      input.on("data", (chunk) => {
        data += chunk;
      });
      input.on("end", () => {
        console.log(data);
        callback(null, { envelope, messageId } as any);
      });
    },
  });
})();

if (config.nodeEnv !== "test" && config.smtpHost && typeof mailTransporter.verify === "function") {
  mailTransporter.verify((error) => {
    if (error) {
      console.warn("SMTP connection verification failed. Outgoing emails might fail to send:", error);
    }
  });
}

export default mailTransporter;
