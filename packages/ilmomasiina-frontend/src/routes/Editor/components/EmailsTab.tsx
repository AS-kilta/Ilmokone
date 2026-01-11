import React from "react";

import { useTranslation } from "react-i18next";

// TODO: fix language selection for email preview
import EmailPreview from "./EmailPreview";
import useEditorErrors from "./errors";
import LanguageSelect from "./LanguageSelect";
import LocalizedFieldRow from "./LocalizedFieldRow";
import Textarea from "./Textarea";

const EmailsTab = () => {
  const { t } = useTranslation();
  const formatError = useEditorErrors();
  return (
    <div>
      <LanguageSelect />
      <LocalizedFieldRow
        name="verificationEmail"
        defaultAsPlaceholder
        as={Textarea}
        label={t("editor.emails.verificationEmail")}
        rows={10}
        formatError={formatError}
        help={t("editor.emails.verificationEmail.info")}
      />
      <EmailPreview />
    </div>
  );
};

export default EmailsTab;
