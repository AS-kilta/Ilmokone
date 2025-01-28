import React, { useEffect, useRef } from "react";

import { Form } from "react-bootstrap";
import { useForm } from "react-final-form";
import { useTranslation } from "react-i18next";
import Combobox from "react-widgets/Combobox";

import { FieldRow } from "@tietokilta/ilmomasiina-components";
import { checkingSlugAvailability, checkSlugAvailability, loadCategories } from "../../../modules/editor/actions";
import { EditorEventType } from "../../../modules/editor/types";
import { useTypedDispatch, useTypedSelector } from "../../../store/reducers";
import DateTimePicker from "./DateTimePicker";
import useEditorErrors from "./errors";
import { useFieldTouched, useFieldValue } from "./hooks";
import SelectBox from "./SelectBox";
import SlugField from "./SlugField";
import Textarea from "./Textarea";

// How long to wait (in ms) for the user to finish typing the slug before checking it.
const SLUG_CHECK_DELAY = 250;

const GenerateSlug = () => {
  const isNew = useTypedSelector((state) => state.editor.isNew);
  const form = useForm();
  const title = useFieldValue<string>("title");
  const touched = useFieldTouched("slug");

  useEffect(() => {
    if (isNew && !touched && title !== undefined) {
      const generatedSlug = title
        .normalize("NFD") // converts e.g. ä to a + umlaut
        .replace(/[^A-Za-z0-9]+/g, "")
        .toLocaleLowerCase("fi");
      form.change("slug", generatedSlug);
    }
  }, [form, isNew, title, touched]);

  return null;
};

const SlugAvailability = () => {
  const slugAvailability = useTypedSelector((state) => state.editor.slugAvailability);
  const eventId = useTypedSelector((state) => state.editor.event?.id);
  const dispatch = useTypedDispatch();
  const { t } = useTranslation();

  const slug = useFieldValue<string>("slug");

  const checkDelay = useRef<number | undefined>();
  useEffect(() => {
    dispatch(checkingSlugAvailability());
    window.clearTimeout(checkDelay.current);
    checkDelay.current = window.setTimeout(() => {
      if (slug) {
        dispatch(checkSlugAvailability(slug));
      }
    }, SLUG_CHECK_DELAY);
  }, [dispatch, slug]);

  if (!slug) {
    return null;
  }
  if (slugAvailability === "checking") {
    return <Form.Text>{t("editor.basic.url.checking")}</Form.Text>;
  }
  if (slugAvailability === null) {
    return null;
  }
  if (slugAvailability.id === null || slugAvailability.id === eventId) {
    return <Form.Text className="text-success">{t("editor.basic.url.free")}</Form.Text>;
  }
  return (
    <Form.Text className="text-danger">{t("editor.basic.url.reserved", { event: slugAvailability.title })}</Form.Text>
  );
};

const BasicDetailsTab = () => {
  const dispatch = useTypedDispatch();
  const allCategories = useTypedSelector((state) => state.editor.allCategories);
  const { t } = useTranslation();
  const formatError = useEditorErrors();

  const eventType = useFieldValue<EditorEventType>("eventType");
  const date = useFieldValue<Date | null>("date");
  const endDate = useFieldValue<Date | null>("date");

  useEffect(() => {
    dispatch(loadCategories());
  }, [dispatch]);

  return (
    <div>
      <FieldRow name="title" label={t("editor.basic.name")} required maxLength={255} formatError={formatError} />
      <GenerateSlug />
      <FieldRow
        name="slug"
        label={t("editor.basic.url")}
        required
        maxLength={255}
        extraFeedback={<SlugAvailability />}
        as={SlugField}
        formatError={formatError}
      />
      <FieldRow
        name="listed"
        label={t("editor.basic.listed")}
        as={Form.Check}
        type="checkbox"
        checkAlign
        checkLabel={t("editor.basic.listed.check")}
        help={t("editor.basic.listed.info")}
        formatError={formatError}
      />
      <FieldRow
        name="eventType"
        label={t("editor.basic.type")}
        as={SelectBox}
        options={[
          [EditorEventType.ONLY_EVENT, t("editor.basic.type.onlyEvent")],
          [EditorEventType.EVENT_WITH_SIGNUP, t("editor.basic.type.eventWithSignup")],
          [EditorEventType.ONLY_SIGNUP, t("editor.basic.type.onlySignup")],
        ]}
        formatError={formatError}
      />
      {eventType !== EditorEventType.ONLY_SIGNUP && (
        <FieldRow
          name="date"
          id="date"
          label={t("editor.basic.startDate")}
          as={DateTimePicker}
          selectsStart
          endDate={endDate}
          required
          formatError={formatError}
        />
      )}
      {eventType !== EditorEventType.ONLY_SIGNUP && (
        <FieldRow
          name="endDate"
          id="endDate"
          label={t("editor.basic.endDate")}
          as={DateTimePicker}
          selectsEnd
          startDate={date}
          help={t("editor.basic.endDate.info")}
          formatError={formatError}
        />
      )}
      {eventType !== EditorEventType.ONLY_EVENT && (
        <FieldRow
          name="registrationStartDate"
          id="registrationStartDate"
          as={DateTimePicker}
          label={t("editor.basic.registrationStartDate")}
          required
          formatError={formatError}
        />
      )}
      {eventType !== EditorEventType.ONLY_EVENT && (
        <FieldRow
          name="registrationEndDate"
          id="registrationEndDate"
          as={DateTimePicker}
          label={t("editor.basic.registrationEndDate")}
          required
          formatError={formatError}
        />
      )}
      {eventType !== EditorEventType.ONLY_EVENT && (
        <FieldRow
          name="signupsPublic"
          label={t("editor.basic.signupsPublic")}
          as={Form.Check}
          type="checkbox"
          checkAlign
          checkLabel={t("editor.basic.signupsPublic.check")}
          help={t("editor.basic.signupsPublic.info")}
          formatError={formatError}
        />
      )}
      <FieldRow
        name="category"
        label={t("editor.basic.category")}
        as={Combobox}
        data={allCategories || []}
        busy={allCategories === null}
        inputProps={{ maxLength: 255 }}
        formatError={formatError}
      />
      <FieldRow name="webpageUrl" label={t("editor.basic.homePage")} maxLength={255} formatError={formatError} />
      <FieldRow name="facebookUrl" label={t("editor.basic.facebook")} maxLength={255} formatError={formatError} />
      <FieldRow name="location" label={t("editor.basic.location")} maxLength={255} formatError={formatError} />
      <FieldRow name="price" label={t("editor.basic.price")} maxLength={255} formatError={formatError} />
      <FieldRow
        name="description"
        label={t("editor.basic.description")}
        help={t("editor.basic.description.info")}
        as={Textarea}
        rows={8}
        formatError={formatError}
      />

      <div className="ilmo--event-description">
        <h1>{t("editor.basic.markdownGuide.title")}</h1>
        <p>{t("editor.basic.markdownGuide.info")}</p>
        <h2>{t("editor.basic.markdownGuide.cheatsheet")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("editor.basic.markdownGuide.write")}</th>
              <th>{t("editor.basic.markdownGuide.toGet")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>*Italic* <em>{t("editor.basic.markdownGuide.or")}</em> _Italic_</td>
              <td>
                <em>Italic</em>
              </td>
            </tr>
            <tr>
              <td>**Bold** <em>{t("editor.basic.markdownGuide.or")}</em> __Bold__</td>
              <td>
                <strong>Bold</strong>
              </td>
            </tr>
            <tr>
              <td>~{t("editor.basic.markdownGuide.strike")}~</td>
              <td>
                <s>{t("editor.basic.markdownGuide.strike")}</s>
              </td>

            </tr>
            <tr>
              <td># {t("editor.basic.markdownGuide.h1")}</td>
              <td>
                <h1>{t("editor.basic.markdownGuide.h1")}</h1>
              </td>

            </tr>
            <tr>
              <td>## {t("editor.basic.markdownGuide.h2")}</td>
              <td>
                <h2>{t("editor.basic.markdownGuide.h2")}</h2>
              </td>

            </tr>
            <tr>
              <td>### {t("editor.basic.markdownGuide.h3")}</td>
              <td>
                <h3>{t("editor.basic.markdownGuide.h3")}</h3>
              </td>

            </tr>
            <tr>
              <td>[{t("editor.basic.markdownGuide.link")}](https://ilmo.as.fi/)</td>
              <td>
                <a href="https://ilmo.as.fi/">{t("editor.basic.markdownGuide.link")}</a>
              </td>

            </tr>
            <tr>
              <td>![{t("editor.basic.markdownGuide.image")}](https://ilmo.as.fi/favicon-32x32.png)</td>
              <td>
                <img src="https://ilmo.as.fi/favicon-32x32.png" alt={t("editor.basic.markdownGuide.image")} />
              </td>

            </tr>
            <tr>
              <td>
                {">"}
                {t("editor.basic.markdownGuide.quote")}
              </td>
              <td>
                <blockquote>{t("editor.basic.markdownGuide.quote")}</blockquote>
              </td>

            </tr>
            <tr>
              <td>
                * {t("editor.basic.markdownGuide.list")}
                <br />* {t("editor.basic.markdownGuide.list")}
                <br />* {t("editor.basic.markdownGuide.list")}
                <br />{t("editor.basic.markdownGuide.or")}
                <br />- {t("editor.basic.markdownGuide.list")}
                <br />- {t("editor.basic.markdownGuide.list")}
                <br />- {t("editor.basic.markdownGuide.list")}
              </td>
              <td>
                <ul>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                </ul>
              </td>

            </tr>
            <tr>
              <td>
                1. {t("editor.basic.markdownGuide.list")}
                <br />
                2. {t("editor.basic.markdownGuide.list")}
                <br />
                3. {t("editor.basic.markdownGuide.list")}
              </td>
              <td>
                <ol>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                  <li>{t("editor.basic.markdownGuide.list")}</li>
                </ol>
              </td>

            </tr>
            <tr>
              <td>---</td>
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
              <td><hr /><em>{t("editor.basic.markdownGuide.divider")}</em></td>
            </tr>
            <tr>
              <td>`{t("editor.basic.markdownGuide.code")}`</td>
              <td>
                <code>{t("editor.basic.markdownGuide.codeResult")}</code>
              </td>
            </tr>
            <tr>
              <td>
                ```
                <br />
                {t("editor.basic.markdownGuide.codeBlock")}
                <br />
                ```
              </td>
              <td>
                <code>{t("editor.basic.markdownGuide.codeBlock")}</code>
              </td>

            </tr>
            <tr>
              <td>https://ilmo.as.fi</td>
              <td>
                <a href="https://ilmo.as.fi/">https://ilmo.as.fi</a>
                <em>({t("editor.basic.markdownGuide.urlNotice")})</em>
              </td>
            </tr>

            <tr>
              <td>
                {t("editor.basic.markdownGuide.footnote")} [^1]
                <br />
                [^1]: {t("editor.basic.markdownGuide.footnoteResult")}
              </td>
              <td>
                {t("editor.basic.markdownGuide.footnote")}
                <sup>1</sup>
                <br />
                1. {t("editor.basic.markdownGuide.footnoteResult")}
              </td>
            </tr>
            <tr>
              <td>
                | {t("editor.basic.markdownGuide.syntax")} | {t("editor.basic.markdownGuide.result")} |
                <br />
                |–––|–––|
                <br />
                | ** | Italic |
                <br />| **** | Bold |
              </td>
              <td>
                <table>
                  <thead>
                    <tr>
                      <td>{t("editor.basic.markdownGuide.syntax")}</td>
                      <td>{t("editor.basic.markdownGuide.result")}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>**</td>
                      <td>Italic</td>
                    </tr>
                    <tr>
                      <td>****</td>
                      <td>Bold</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BasicDetailsTab;
