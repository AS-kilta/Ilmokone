import { marked } from "marked";
import { Trans, useTranslation } from "react-i18next";

import { adminUrl } from "../../config";
import type { Event } from "../../models/event";

interface EventDetailsProps {
  event: Event | { title: string; location?: string | null; [key: string]: any };
  date: string | null;
}

export function EventDetails({ event, date }: EventDetailsProps) {
  const { t } = useTranslation();
  return (
    <div className="content-block">
      <p className="bodyText">{t("emails.eventDetails")}</p>
      <ul>
        <li>
          <strong>{t("emails.event")}:</strong> {event.title}
        </li>
        {event.location && (
          <li>
            <strong>{t("emails.location")}:</strong> {event.location}
          </li>
        )}
        {date && (
          <li>
            <strong>{t("emails.time")}:</strong> {date}
          </li>
        )}
      </ul>
    </div>
  );
}

interface SignupDetailsProps {
  name: string;
  email: string;
  quota: string;
  answers: { label: string; answer: string }[];
}

export function SignupDetails({ name, email, quota, answers }: SignupDetailsProps) {
  const { t } = useTranslation();
  return (
    <div className="content-block">
      <p className="bodyText">{t("emails.signupDetails")}</p>
      <ul>
        {name && (
          <li>
            <strong>{t("emails.name")}:</strong> {name}
          </li>
        )}
        <li>
          <strong>{t("emails.email")}:</strong> {email}
        </li>
        <li>
          <strong>{t("emails.quota")}:</strong> {quota}
        </li>
        {answers.map((answer, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <strong>{answer.label}:</strong> {answer.answer}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface EditLinkProps {
  href: string;
}

export function EditLink({ href }: EditLinkProps) {
  const { t } = useTranslation();
  return (
    <div className="content-block-last">
      <p className="bodyText">
        <strong>
          <Trans t={t} i18nKey="emails.editLink">
            {"If you want to edit or cancel your signup, you can do it by clicking "}
            <a href={href}>this link</a>.
          </Trans>
        </strong>
      </p>
    </div>
  );
}

export function LoginLink({ siteUrl }: { siteUrl?: string }) {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const url = siteUrl || adminUrl({ lang: language });
  return (
    <div className="content-block-last">
      <p className="bodyText">
        <Trans t={t} i18nKey="emails.login" values={{ url }}>
          {"You can log in at "}
          <a href={url}>{url}</a>.
        </Trans>
      </p>
    </div>
  );
}

interface PendingPaymentWarningProps {
  event: Event | { payments?: string | null; [key: string]: any };
  signupLink: string;
}

export function PendingPaymentWarning({ event, signupLink }: PendingPaymentWarningProps) {
  const { t } = useTranslation();
  return (
    <div className="content-block">
      <p className="bodyText">
        <strong>{t("emails.pendingPayment")}</strong>
        {event.payments === "online" && (
          <>
            {" "}
            <Trans t={t} i18nKey="emails.completePayment">
              {"You can complete the payment on the "}
              <a href={signupLink}>signup page</a>.
            </Trans>
          </>
        )}
      </p>
    </div>
  );
}

interface VerificationEmailProps {
  verificationEmail: string | null;
}

export function VerificationEmail({ verificationEmail }: VerificationEmailProps) {
  if (!verificationEmail) return null;
  const html = marked.parse(verificationEmail, { async: false }) as string;
  return (
    <div
      className="content-block"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
