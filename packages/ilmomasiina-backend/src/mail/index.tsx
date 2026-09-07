import path from "path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import inline from "web-resource-inliner";

import config from "../config";
import i18n from "../i18n";
import mailTransporter, { EmailAttachment } from "./config";
import { EmailRenderContext } from "./context";
import Confirmation, { ConfirmationMailParams } from "./templates/Confirmation";
import NewUser, { CredentialsMailParams } from "./templates/NewUser";
import Payment, { PaymentMailParams } from "./templates/Payment";
import QueueMail, { QueueMailParams } from "./templates/QueueMail";
import ResetPassword from "./templates/ResetPassword";

export type { ConfirmationMailParams, CredentialsMailParams, EmailAttachment, PaymentMailParams, QueueMailParams };

const assetsDir = path.resolve(__dirname, "../../emails");

const DOCTYPE =
  "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" " +
  "\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">";

interface RenderEmailOptions {
  isSending?: boolean;
}

async function renderEmail(
  element: ReactElement,
  language: string,
  options: RenderEmailOptions = {},
): Promise<{ html: string; attachments: EmailAttachment[] }> {
  const { isSending = false } = options;
  const attachments: EmailAttachment[] = [];
  let imageCounter = 0;

  const addAttachment = (att: Omit<EmailAttachment, "filename" | "cid">) => {
    imageCounter += 1;
    const cid = `img_${imageCounter}`;
    const attachment: EmailAttachment = {
      ...att,
      filename: `${cid}.png`,
      cid,
    };
    attachments.push(attachment);
    return cid;
  };

  const i18nInstance = i18n.cloneInstance({ lng: language });

  const wrapped = (
    <I18nextProvider i18n={i18nInstance}>
      <EmailRenderContext.Provider value={{ isSending, addAttachment }}>
        {element}
      </EmailRenderContext.Provider>
    </I18nextProvider>
  );

  const html = renderToStaticMarkup(wrapped);
  const withDoctype = `${DOCTYPE}\n${html}`;

  // Skip resource inlining only for console transport when actually sending
  if (isSending && mailTransporter.transporter.name === "console fallback") {
    return { html: withDoctype, attachments };
  }

  return new Promise((resolve, reject) => {
    inline.html(
      {
        fileContent: withDoctype,
        relativeTo: assetsDir,
        strict: true,
      },
      (error: unknown, inlined: string) => {
        if (error) {
          reject(error);
        } else {
          resolve({ html: inlined, attachments });
        }
      },
    );
  });
}

function getLanguage(language: string | null): string {
  return language || config.defaultLanguage;
}

export default class EmailService {
  static send(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
    if (!config.mailFrom) {
      console.warn(`Attempted to send an email to ${to} ("${subject}") but MAIL_FROM is not configured.`);
    }

    const msg = {
      to,
      from: config.mailFrom,
      subject,
      html,
      attachments,
    };

    return mailTransporter.sendMail(msg);
  }

  static async createConfirmationEmailPreview(
    language: string | null,
    params: ConfirmationMailParams,
  ): Promise<string | undefined> {
    try {
      const lng = getLanguage(language);
      const { html } = await renderEmail(<Confirmation {...params} />, lng, { isSending: false });
      return html;
    } catch (error) {
      console.error("Failed to generate confirmation email preview:", error);
      return undefined;
    }
  }

  static async sendConfirmationMail(to: string, language: string | null, params: ConfirmationMailParams) {
    try {
      const lng = getLanguage(language);
      const subject = i18n.t(`emails.confirmation.${params.type}.subject`, { lng, event: params.event.title });
      const { html, attachments } = await renderEmail(<Confirmation {...params} />, lng, { isSending: true });
      await EmailService.send(to, subject, html, attachments);
    } catch (error) {
      console.error(`Failed to send confirmation email to ${to}:`, error);
      throw error;
    }
  }

  static async sendPaymentConfirmationMail(to: string, language: string | null, params: PaymentMailParams) {
    try {
      const lng = getLanguage(language);
      const subject = i18n.t("emails.payment.subject", { lng, event: params.event.title });
      const { html, attachments } = await renderEmail(<Payment {...params} />, lng, { isSending: true });
      await EmailService.send(to, subject, html, attachments);
    } catch (error) {
      console.error(`Failed to send payment confirmation email to ${to}:`, error);
      throw error;
    }
  }

  static async sendNewUserMail(to: string, language: string | null, params: CredentialsMailParams) {
    try {
      const lng = getLanguage(language);
      const subject = i18n.t("emails.newUser.subject", { lng });
      const { html, attachments } = await renderEmail(<NewUser {...params} />, lng, { isSending: true });
      await EmailService.send(to, subject, html, attachments);
    } catch (error) {
      console.error(`Failed to send new user invitation email to ${to}:`, error);
      throw error;
    }
  }

  static async sendResetPasswordMail(to: string, language: string | null, params: CredentialsMailParams) {
    try {
      const lng = getLanguage(language);
      const subject = i18n.t("emails.resetPassword.subject", { lng });
      const { html, attachments } = await renderEmail(<ResetPassword {...params} />, lng, { isSending: true });
      await EmailService.send(to, subject, html, attachments);
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}:`, error);
      throw error;
    }
  }

  static async sendPromotedFromQueueMail(to: string, language: string | null, params: QueueMailParams) {
    try {
      const lng = getLanguage(language);
      const subject = i18n.t("emails.queueMail.subject", { lng, event: params.event.title });
      const { html, attachments } = await renderEmail(<QueueMail {...params} />, lng, { isSending: true });
      await EmailService.send(to, subject, html, attachments);
    } catch (error) {
      console.error(`Failed to send queue promotion email to ${to}:`, error);
      throw error;
    }
  }
}
