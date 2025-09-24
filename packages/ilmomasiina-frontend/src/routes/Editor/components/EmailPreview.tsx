import React, { useEffect, useMemo, useRef, useState } from "react";

import { ButtonGroup, Form, ToggleButton } from "react-bootstrap";
import { useFormState } from "react-final-form";
import { useTranslation } from "react-i18next";

import adminApiFetch from "../../../api";
import type { EditorEvent } from "../../../modules/editor/types";
import { useTypedDispatch, useTypedSelector } from "../../../store/reducers";

interface PreviewResponse {
  html: string;
}

type MailType = "signup" | "edit";
type LangType = "fi" | "en";
type QueuePos = 5 | null;

const PreviewIFrame = ({ htmlString }) => {
  const previewRef = useRef<HTMLIFrameElement>();
  const [previewHeight, setPreviewHeight] = useState("0px");

  const onPreviewLoad = () => {
    setPreviewHeight(`${previewRef.current?.contentWindow?.document.body.scrollHeight}px`);
  };

  useEffect(() => {
    onPreviewLoad();
  }, []);

  return (
     <iframe
        ref={previewRef}
        onLoad={onPreviewLoad}
        title="Email preview"
        className="email-preview"
        sandbox="allow-same-origin"
        srcDoc={htmlString}
        height={previewHeight}
        scrolling="no"
        />
  );
};

const EmailPreview = () => {
  const { values } = useFormState<EditorEvent>();
  const eventId = useTypedSelector((s) => s.editor.event?.id);
  const { i18n } = useTranslation();
  const dispatch = useTypedDispatch();
  const accessToken = useTypedSelector((s) => s.auth.accessToken);

  const [admin, setAdmin] = useState(false);
  const [type, setType] = useState<MailType>("signup");
  const [lang, setLang] = useState<LangType>("fi");
  const [queuePos, setQueuePos] = useState<QueuePos>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derived = useMemo(() => {
    const event = eventId;

    const quotaTitle = values?.quotas?.[0]?.title || "Quota";
    const answers = (values?.questions || []).map((q) => ({ label: q.question, answer: "vastaus" }));

    const dateStr = values?.date ? values.date.toLocaleString(i18n.language || "fi-FI") : null;

    return { event, quotaTitle, answers, dateStr };
  }, [eventId,
    values?.quotas,
    values?.questions,
    values?.date,
    i18n.language]);

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const body = {
          language: lang || null,
          params: {
            name: "Example User",
            email: "user@example.com",
            quota: derived.quotaTitle,
            answers: derived.answers,
            ...(queuePos !== null ? { queuePosition: queuePos } : {}),
            type,
            admin,
            date: derived.dateStr,
            event: derived.event,
            cancelLink: "https://as.fi",
          },
        };
        const resp = await adminApiFetch<PreviewResponse>(
          "admin/emails/preview",
          { accessToken, method: "POST", body },
          dispatch,
        );
        if (!cancelled) setHtml(resp.html);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Email preview failed", e);
        if (!cancelled) setError("Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [admin, type, queuePos, derived, lang, accessToken, dispatch]);

  // TODO: fix reload jump
  // TODO: Translations
  // TODO: set some guide text in editor
  // TODO: styles

  return (
    <div className="email-preview-container">
      <h2>Esikatselu</h2>
      <p>Alla olevilla valinnoilla voi esikatsella miltä vahvistusviesti näyttää eri tilanteissa</p>
      <div className="email-preview-options">
        <Form.Check
          type="switch"
          id="email-preview-admin"
          label="Adminin tekemä toimenpide"
          checked={admin}
          onChange={(e) => setAdmin(e.currentTarget.checked)}
        />
        <ButtonGroup>
          <ToggleButton
            id="email-type-signup"
            type="radio"
            variant={type === "signup" ? "primary" : "outline-primary"}
            name="email-type"
            value="signup"
            checked={type === "signup"}
            onChange={() => setType("signup")}
          >
            Ilmo
          </ToggleButton>
          <ToggleButton
            id="email-type-edit"
            type="radio"
            variant={type === "edit" ? "primary" : "outline-primary"}
            name="email-type"
            value="edit"
            checked={type === "edit"}
            onChange={() => setType("edit")}
          >
            Ilmon muokkaus
          </ToggleButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToggleButton
            id="email-lang-fi"
            type="radio"
            variant={lang === "fi" ? "primary" : "outline-primary"}
            name="email-lang"
            value="email-lang"
            checked={lang === "fi"}
            onChange={() => setLang("fi")}
          >
            Suomeksi
          </ToggleButton>
          <ToggleButton
            id="email-lang-en"
            type="radio"
            variant={lang === "en" ? "primary" : "outline-primary"}
            name="email-lang"
            value="email-lang"
            checked={lang === "en"}
            onChange={() => setLang("en")}
          >
            Englanniksi
          </ToggleButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToggleButton
            id="email-queue-pos-0"
            type="radio"
            variant={queuePos === null ? "primary" : "outline-primary"}
            name="email-queue-pos"
            value="email-queue-pos"
            checked={queuePos === null}
            onChange={() => setQueuePos(null)}
          >
            Tapahtumassa
          </ToggleButton>
          <ToggleButton
            id="email-queue-pos-5"
            type="radio"
            variant={queuePos === 5 ? "primary" : "outline-primary"}
            name="email-queue-pos"
            value="email-queue-pos"
            checked={queuePos === 5}
            onChange={() => setQueuePos(5)}
          >
            Jonossa
          </ToggleButton>
        </ButtonGroup>
      </div>

      {loading && <div>Loading preview…</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && html && (
        <PreviewIFrame htmlString={html} />
      )}

</div>
  );
};

export default EmailPreview;
