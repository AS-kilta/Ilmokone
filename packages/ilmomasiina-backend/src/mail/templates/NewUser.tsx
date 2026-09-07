import { useTranslation } from "react-i18next";

import Layout from "../components/Layout";
import { LoginLink } from "../components/shared";

export interface CredentialsMailParams {
  email: string;
  password: string;
  siteUrl?: string;
}

export default function NewUser({ email, password, siteUrl }: CredentialsMailParams) {
  const { t } = useTranslation();
  return (
    <Layout
      alertVariant="alert-neutral"
      alertText={t("emails.newUser.alert")}
      alertOptions={{ font: "jacquard", fontSize: 30 }}
    >
      <div className="content-block">
        <p className="bodyText">{t("emails.newUser.created")}</p>
        <ul>
          <li>
            <strong>{t("emails.email")}:</strong> {email}
          </li>
          <li>
            <strong>{t("emails.newUser.password")}:</strong> {password}
          </li>
        </ul>
      </div>
      <LoginLink siteUrl={siteUrl} />
    </Layout>
  );
}
