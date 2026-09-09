import { useTranslation } from "react-i18next";

import Layout from "../components/Layout";
import { LoginLink } from "../components/shared";
import type { CredentialsMailParams } from "./NewUser";

export default function ResetPassword({ email, password, siteUrl }: CredentialsMailParams) {
  const { t } = useTranslation();
  return (
    <Layout
      alertVariant="alert-warning"
      alertText={t("emails.resetPassword.alert")}
      alertOptions={{ font: "jacquard", fontSize: 34 }}
    >
      <div className="content-block">
        <p className="bodyText">{t("emails.resetPassword.reset")}</p>
        <ul>
          <li>
            <strong>{t("emails.email")}:</strong> {email}
          </li>
          <li>
            <strong>{t("emails.resetPassword.newPassword")}:</strong> {password}
          </li>
        </ul>
      </div>
      <LoginLink siteUrl={siteUrl} />
    </Layout>
  );
}
