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

const EmailPreview = () => {
  // Narrow subscription (avoid rerenders for untouched form meta)
  const { values } = useFormState<EditorEvent>({ subscription: { values: true } });
  const eventId = useTypedSelector((s) => s.editor.event?.id);
  const { t, i18n } = useTranslation();
  const dispatch = useTypedDispatch();
  const accessToken = useTypedSelector((s) => s.auth.accessToken);

  const [admin, setAdmin] = useState(false);
  const [type, setType] = useState<MailType>("signup");
  const [lang, setLang] = useState<LangType>("fi");
  const [queuePos, setQueuePos] = useState<QueuePos>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Use a non-zero default height to reserve space and avoid layout jump
  const [previewHeight, setPreviewHeight] = useState("400px");

  // Store absolute top position (document coordinates) before updating HTML so we can compensate scroll
  const prevWrapperTopRef = useRef<number | null>(null);

  const derived = useMemo(() => {
    const event = eventId;
    const quotaTitle = values?.quotas?.[0]?.title || "Kiintiö / Quota";
    const answers = (values?.questions || []).map((q) => ({ label: q.question, answer: "Todella hauska ja samaistuttava vastaus / A really funny and relatable answer" }));
    const dateStr = values?.date ? values.date.toLocaleString(i18n.language || "fi-FI") : null;
    return { event, quotaTitle, answers, dateStr };
  }, [eventId, values?.quotas, values?.questions, values?.date, i18n.language]);

  const onPreviewLoad = () => {
    const body = previewRef.current?.contentWindow?.document?.body;
    if (!body) return;
    requestAnimationFrame(() => {
      const newHeight = body.scrollHeight;
      if (newHeight) setPreviewHeight(`${newHeight}px`);
      // Compensate scroll so page doesn't jump when iframe height changes
      if (prevWrapperTopRef.current != null && wrapperRef.current) {
        const newAbsTop = wrapperRef.current.getBoundingClientRect().top + window.scrollY;
        const diff = newAbsTop - prevWrapperTopRef.current;
        if (Math.abs(diff) > 1) {
          window.scrollBy({ top: diff, behavior: "auto" });
        }
        prevWrapperTopRef.current = null; // reset
      }
    });
  };

  // Debounced key for fetching preview (prevents rapid toggles causing multiple requests)
  const fetchKey = useMemo(
    () => JSON.stringify({ admin, type, queuePos, lang, d: derived }),
    [admin, type, queuePos, lang, derived],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (accessToken) {
      timer = setTimeout(async () => {
        setLoading(true);
        setError(null);
        try {
          const body = {
            language: lang || null,
            params: {
              name: "aASi Asiakas",
              email: "aasi@as.fi",
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
          // Record wrapper top before HTML swap for scroll compensation
          if (wrapperRef.current) {
            prevWrapperTopRef.current = wrapperRef.current.getBoundingClientRect().top + window.scrollY;
          }
          const resp = await adminApiFetch<PreviewResponse>(
            "admin/emails/preview",
            { accessToken, method: "POST", body, signal: controller.signal },
            dispatch,
          );
          if (!cancelled) {
            setHtml(resp.html);
          }
        } catch (e: any) {
          if (e?.name === "AbortError") return; // ignore aborts
          // eslint-disable-next-line no-console
          console.error("Email preview failed", e);
          if (!cancelled) setError("Failed to load preview");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }, 200); // 200ms debounce
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [fetchKey, accessToken, dispatch, admin, type, queuePos, lang, derived.quotaTitle, derived.answers, derived.dateStr, derived.event]);

  // TODO: styles

  return (
    <div className="email-preview-container">
      <h2>{t("editor.emails.verificationEmail.preview")}</h2>
      <p>{t("editor.emails.verificationEmail.preview.desc")}</p>
      <div className="email-preview-options">
        <Form.Check
          type="switch"
          id="email-preview-admin"
          label={t("editor.emails.verificationEmail.preview.adminEvent")}
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
            {t("editor.emails.verificationEmail.preview.mailType.signup")}
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
            {t("editor.emails.verificationEmail.preview.mailType.edit")}
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
            {t("editor.emails.verificationEmail.preview.language.fi")}
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
            {t("editor.emails.verificationEmail.preview.language.en")}
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
            {t("editor.emails.verificationEmail.preview.queue.inQuota")}
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
            {t("editor.emails.verificationEmail.preview.queue.inQueue")}
          </ToggleButton>
        </ButtonGroup>
      </div>

      {error && <div className="text-danger">{error}</div>}
      <div
        ref={wrapperRef}
        className="email-preview-frame-wrapper"
      >
        <iframe
          ref={previewRef}
          onLoad={onPreviewLoad}
          title="Email preview"
          className="email-preview"
          sandbox="allow-same-origin"
          srcDoc={html}
          height={previewHeight}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
            aria-live="polite"
          >
            {t("editor.emails.verificationEmail.preview.loading")}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPreview;

