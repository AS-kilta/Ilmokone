import { useTranslation } from "react-i18next";

import { SignupPaymentStatus } from "@tietokilta/ilmomasiina-models";
import type { Event } from "../../models/event";
import Layout from "../components/Layout";
import { EditLink, EventDetails, PendingPaymentWarning, SignupDetails, VerificationEmail } from "../components/shared";

export interface ConfirmationMailParams {
  name: string;
  email: string;
  quota: string;
  answers: { label: string; answer: string }[];
  queuePosition: number | null;
  type: "signup" | "edit";
  admin: boolean;
  date: string | null;
  event: Event | { title: string; location?: string | null; verificationEmail?: string | null; [key: string]: any };
  paymentStatus?: SignupPaymentStatus | null;
  signupLink?: string;
  cancelLink?: string;
}

export default function Confirmation({
  name,
  email,
  quota,
  answers,
  queuePosition,
  type,
  admin,
  date,
  event,
  paymentStatus,
  signupLink,
  cancelLink,
}: ConfirmationMailParams) {
  const { t } = useTranslation();
  const link = signupLink || cancelLink || "";

  return (
    <Layout
      alertVariant="alert-good"
      alertText={t("emails.confirmation.alert")}
      alertOptions={{ font: "jacquard", fontSize: 34 }}
    >
      {admin && type === "signup" && (
        <div className="content-block">
          <p className="bodyText">
            <strong>{t("emails.adminSignup")}</strong>
          </p>
        </div>
      )}
      {admin && type === "edit" && (
        <div className="content-block">
          <p className="bodyText">
            <strong>{t("emails.adminEdit")}</strong>
          </p>
        </div>
      )}
      {paymentStatus === SignupPaymentStatus.PENDING && !queuePosition && link && (
        <PendingPaymentWarning event={event} signupLink={link} />
      )}
      <VerificationEmail verificationEmail={event.verificationEmail ?? null} />
      {queuePosition != null && (
        <div className="content-block">
          <p className="bodyText">
            <strong>{t("emails.queuePosition", { position: queuePosition })}</strong> {t("emails.queueNotify")}
          </p>
        </div>
      )}
      <EventDetails event={event} date={date} />
      <SignupDetails name={name} email={email} quota={quota} answers={answers} />
      {link && <EditLink href={link} />}
    </Layout>
  );
}
