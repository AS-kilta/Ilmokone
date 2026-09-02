import moment from "moment-timezone";

import { SignupStatus } from "@tietokilta/ilmomasiina-models";
import config, { editSignupUrl } from "../config";
import i18n from "../i18n";
import { Signup } from "../models/signup";
import { generateToken } from "../routes/signups/editTokens";
import EmailService, { ConfirmationMailParams, MailEvent } from ".";

export default async function sendSignupConfirmationMail(
  signup: Signup,
  type: ConfirmationMailParams["type"],
  admin: boolean,
) {
  if (signup.email === null) return;

  const lng = signup.language ?? undefined;

  // TODO: convert to include
  const answers = await signup.getAnswers();
  const quota = await signup.getQuota();
  const event = await quota.getEvent();
  const questions = await event.getQuestions();
  const quotas = await event.getQuotas();

  const locale = (lng && event.languages?.[lng]) || null;
  const quotaIndex = quotas.findIndex((q) => q.id === quota.id);

  // Show name only if filled
  const fullName = `${signup.firstName ?? ""} ${signup.lastName ?? ""}`.trim();

  const questionFields = questions
    .map((question, qIndex) => <const>[question, qIndex, answers.find((answer) => answer.questionId === question.id)])
    .filter(([, , answer]) => answer)
    .map(([question, qIndex, answer]) => ({
      label: (locale?.questions && locale.questions[qIndex]?.question) || question.question,
      answer: Array.isArray(answer!.answer) ? answer!.answer.join(", ") : answer!.answer,
    }));

  const dateFormat = i18n.t("dateFormat.general", { lng });
  const date = event.date && moment(event.date).tz(config.timezone).format(dateFormat);

  const editToken = generateToken(signup.id);
  const cancelLink = editSignupUrl({ id: signup.id, editToken, lang: signup.language || config.defaultLanguage });

  const localizedEvent = {
    ...event.get({ plain: true }),
    title: locale?.title || event.title,
    location: locale?.location ?? event.location,
    verificationEmail: locale?.verificationEmail ?? event.verificationEmail,
  };

  const params = {
    name: fullName,
    email: signup.email,
    quota: (locale?.quotas && locale.quotas[quotaIndex]?.title) || quota.title,
    answers: questionFields,
    queuePosition: signup.status === SignupStatus.IN_QUEUE ? signup.position : null,
    type,
    admin,
    date,
    event: localizedEvent as MailEvent,
    cancelLink,
  };

  try {
    await EmailService.sendConfirmationMail(signup.email, signup.language, params);
    if (signup.emailError) {
      await signup.update({ emailError: null });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await signup.update({ emailError: errorMsg }).catch((err) => {
      console.error("Failed to save emailError on signup:", err);
    });
  }
}
