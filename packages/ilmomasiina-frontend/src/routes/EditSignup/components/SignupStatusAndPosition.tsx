import React from "react";

import { useTranslation } from "react-i18next";

import { useEditSignupContext } from "@tietokilta/ilmomasiina-client";
import { SignupStatus as SignupStatusEnum } from "@tietokilta/ilmomasiina-models";

const SignupStatusAndPosition = () => {
  const { localizedEvent: event, localizedSignup: signup } = useEditSignupContext();
  const { status, position, quota } = signup!;
  const { openQuotaSize } = event!;
  const { t } = useTranslation();

  if (!status) return null;

  if (status === SignupStatusEnum.IN_QUOTA) {
    const showSize = !event?.hideQuotaSizes && quota.size;
    return (
      <p>
        {t("editSignup.position.quota", {
          quota: quota.title,
          position: `${position}${showSize ? ` / ${quota.size}` : ""}`,
        })}
      </p>
    );
  }

  if (status === SignupStatusEnum.IN_OPEN_QUOTA) {
    const pos = !event?.hideQuotaSizes ? `${position} / ${openQuotaSize}` : `${position}`;
    return <p>{t("editSignup.position.openQuota", { position: pos })}</p>;
  }

  return <p>{t("editSignup.position.queue", { position })}</p>;
};

export default SignupStatusAndPosition;
