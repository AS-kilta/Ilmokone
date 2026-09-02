import Email from "email-templates";
import { existsSync } from "fs";
import i18next from "i18next";
// eslint-disable-next-line import/no-extraneous-dependencies
import { marked } from "marked";
import path from "path";

import config, { adminUrl } from "../config";
import i18n from "../i18n";
import mailTransporter from "./config";
import { renderVectorSvg, vectorText } from "./vectorText";

// Configure marked to allow simple text formatting for custom event verification emails
function md(text: string) {
  return marked.parse(text, { async: false }) as string;
}

export interface MailEvent {
  title: string;
  location?: string | null;
  verificationEmail?: string | null;
  [key: string]: any;
}

export interface ConfirmationMailParams {
  name: string;
  email: string;
  quota: string;
  answers: {
    label: string;
    answer: string;
  }[];
  queuePosition: number | null;
  type: "signup" | "edit";
  admin: boolean;
  date: string | null;
  event: MailEvent;
  cancelLink: string;
}

export interface NewUserMailParams {
  email: string;
  password: string;
}

export interface PromotedFromQueueMailParams {
  event: MailEvent;
  date: string | null;
}

const TEMPLATE_DIR = path.join(__dirname, "../../emails");

const templateCache = new Map<string, { template: string; lng: string }>();

/** Gets a localized template for the given language, or a fallback one if it doesn't exist. */
function getTemplate(language: string | null, template: string) {
  const lng = language || config.defaultLanguage;
  // ensure no path injections
  if (!/^[a-zA-Z-]{2,}$/.test(lng)) throw new Error("invalid language");

  const cacheKey = `${lng}/${template}`;
  const cached = templateCache.get(cacheKey);
  if (cached) return cached;

  const localizedPath = path.join(TEMPLATE_DIR, lng, `${template}.pug`);
  if (existsSync(localizedPath)) {
    const result = { template: localizedPath, lng };
    templateCache.set(cacheKey, result);
    return result;
  }

  const defaultPath = path.join(TEMPLATE_DIR, config.defaultLanguage, `${template}.pug`);
  const result = { template: defaultPath, lng: config.defaultLanguage };
  templateCache.set(cacheKey, result);
  return result;
}

const TEMPLATE_OPTIONS: Email.EmailConfig = {
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.join(TEMPLATE_DIR, "css"),
    },
  },
};

const emailRenderer = new Email(TEMPLATE_OPTIONS);

function getBrandedParams<T extends object>(params: T) {
  return {
    ...params,
    branding: {
      footerText: config.brandingMailFooterText,
      footerLink: config.brandingMailFooterLink,
    },
    md,
    vectorText,
    renderVectorSvg,
  };
}

export default class EmailService {
  static send(to: string, subject: string, html: string) {
    if (!config.mailFrom) {
      console.warn(`Attempted to send an email to ${to} ("${subject}") but MAIL_FROM is not configured.`);
    }

    const msg = {
      to,
      from: config.mailFrom,
      subject,
      html,
    };

    return mailTransporter.sendMail(msg);
  }

  static async createConfirmationEmailPreview(
    language: string | null,
    params: ConfirmationMailParams,
  ): Promise<string | undefined> {
    try {
      const brandedParams = getBrandedParams(params);
      const { template } = getTemplate(language, "confirmation");
      const html = await emailRenderer.render(template, brandedParams);
      return html;
    } catch (error) {
      console.error("Failed to generate confirmation email preview:", error);
      return undefined;
    }
  }

  static async sendConfirmationMail(to: string, language: string | null, params: ConfirmationMailParams) {
    try {
      const brandedParams = getBrandedParams(params);
      const { template, lng } = getTemplate(language, "confirmation");
      const html = await emailRenderer.render(template, brandedParams);
      const subject = i18next.t(`emails.confirmation.${params.type}.subject`, {
        lng,
        event: params.event.title,
      });
      await EmailService.send(to, subject, html);
    } catch (error) {
      console.error(`Failed to send confirmation email to ${to}:`, error);
      throw error;
    }
  }

  static async sendNewUserMail(to: string, language: string | null, params: NewUserMailParams) {
    try {
      const brandedParams = getBrandedParams({
        ...params,
        siteUrl: adminUrl({ lang: language || config.defaultLanguage }),
      });
      const { template, lng } = getTemplate(language, "newUser");
      const html = await emailRenderer.render(template, brandedParams);
      const subject = i18n.t("emails.newUser.subject", { lng });
      await EmailService.send(to, subject, html);
    } catch (error) {
      console.error(`Failed to send new user invitation email to ${to}:`, error);
      throw error;
    }
  }

  static async sendResetPasswordMail(to: string, language: string | null, params: NewUserMailParams) {
    try {
      const brandedParams = getBrandedParams({
        ...params,
        siteUrl: adminUrl({ lang: language || config.defaultLanguage }),
      });
      const { template, lng } = getTemplate(language, "resetPassword");
      const html = await emailRenderer.render(template, brandedParams);
      const subject = i18n.t("emails.resetPassword.subject", { lng });
      await EmailService.send(to, subject, html);
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}:`, error);
      throw error;
    }
  }

  static async sendPromotedFromQueueMail(to: string, language: string | null, params: PromotedFromQueueMailParams) {
    try {
      const brandedParams = getBrandedParams(params);
      const { template, lng } = getTemplate(language, "queueMail");
      const html = await emailRenderer.render(template, brandedParams);
      const subject = i18n.t("emails.promotedFromQueue.subject", {
        lng,
        event: params.event.title,
      });
      await EmailService.send(to, subject, html);
    } catch (error) {
      console.error(`Failed to send queue promotion email to ${to}:`, error);
      throw error;
    }
  }
}
