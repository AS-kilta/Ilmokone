import { Trans, useTranslation } from "react-i18next";

import { SignupPaymentStatus } from "@tietokilta/ilmomasiina-models";
import type { Event } from "../../models/event";
import Layout from "../components/Layout";
import { EditLink, EventDetails, PendingPaymentWarning } from "../components/shared";

export interface QueueMailParams {
  event: Event | { title: string; location?: string | null; [key: string]: any };
  date: string | null;
  paymentStatus?: SignupPaymentStatus | null;
  signupLink?: string;
  cancelLink?: string;
}

export default function QueueMail({ event, date, paymentStatus, signupLink, cancelLink }: QueueMailParams) {
  const { t } = useTranslation();
  const link = signupLink || cancelLink || "";

  return (
    <Layout
      alertVariant="alert-good"
      alertText={t("emails.queueMail.alert")}
      alertOptions={{ font: "jacquard", fontSize: 34 }}
    >
      <div className="content-block">
        <p className="bodyText">
          <Trans t={t} i18nKey="emails.queueMail.accepted">
            {"Your signup to "}
            <strong>{{ event: event.title }}</strong>
            {" was accepted from the queue."}
          </Trans>
        </p>
      </div>
      {paymentStatus === SignupPaymentStatus.PENDING && link && (
        <PendingPaymentWarning event={event} signupLink={link} />
      )}
      <EventDetails event={event} date={date} />
      {link && <EditLink href={link} />}
    </Layout>
  );
}
