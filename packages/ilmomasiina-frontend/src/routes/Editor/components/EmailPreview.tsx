import React, { useEffect, useMemo, useRef, useState } from "react";

import { ButtonGroup, ToggleButton } from "react-bootstrap";
import { useFormState } from "react-final-form";
import { useTranslation } from "react-i18next";

import type { EditorEvent } from "../../../modules/editor/types";
import useStore from "../../../modules/store";

interface PreviewResponse {
  html: string;
}

type QueuePos = 5 | null;

const EmailPreview = () => {
  // Narrow subscription (avoid rerenders for untouched form meta)
  const { values } = useFormState<EditorEvent>({ subscription: { values: true } });
  const eventId = useStore((s) => s.editor.event?.id);
  const { t, i18n } = useTranslation();
  const adminApiFetch = useStore((s) => s.auth.adminApiFetch);
  const accessToken = useStore((s) => s.auth.accessToken);
  const selectedLanguage = useStore((s) => s.editor.selectedLanguage);

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
    const isDefault = selectedLanguage === values?.defaultLanguage;
    const locale = isDefault ? null : values?.languages?.[selectedLanguage];

    const quotaTitle = locale?.quotas?.[0]?.title || values?.quotas?.[0]?.title || "Kiintiö / Quota";
    const answers = (values?.questions || []).map((q, idx) => ({
      label: locale?.questions?.[idx]?.question || q.question,
      answer: "Todella hauska ja samaistuttava vastaus / A really funny and relatable answer",
    }));
    const dateStr = values?.date ? values.date.toLocaleString(selectedLanguage || i18n.language || "fi-FI") : null;

    const eventData = {
      title: (isDefault ? values?.title : locale?.title) || values?.title || "",
      location: (isDefault ? values?.location : locale?.location) ?? values?.location ?? null,
      verificationEmail:
        (isDefault ? values?.verificationEmail : locale?.verificationEmail) ?? values?.verificationEmail ?? null,
    };

    return { eventId, eventData, quotaTitle, answers, dateStr };
  }, [
    eventId,
    selectedLanguage,
    values?.defaultLanguage,
    values?.languages,
    values?.title,
    values?.location,
    values?.verificationEmail,
    values?.quotas,
    values?.questions,
    values?.date,
    i18n.language,
  ]);

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
    () => JSON.stringify({ queuePos, lang: selectedLanguage, d: derived }),
    [queuePos, selectedLanguage, derived],
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
            language: selectedLanguage || null,
            params: {
              name: "aASi Asiakas",
              email: "aasi@as.fi",
              quota: derived.quotaTitle,
              answers: derived.answers,
              ...(queuePos !== null ? { queuePosition: queuePos } : {}),
              type: "signup" as const,
              admin: false,
              date: derived.dateStr,
              event: derived.eventId || "preview-event",
              eventData: derived.eventData,
              cancelLink: "https://as.fi",
            },
          };
          // Record wrapper top before HTML swap for scroll compensation
          if (wrapperRef.current) {
            prevWrapperTopRef.current = wrapperRef.current.getBoundingClientRect().top + window.scrollY;
          }
          const resp = await adminApiFetch<PreviewResponse>("admin/emails/preview", {
            method: "POST",
            body,
            signal: controller.signal,
          });
          if (!cancelled) setHtml(resp.html);
        } catch (e: any) {
          if (e?.name === "AbortError") return; // ignore aborts
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
  }, [
    fetchKey,
    accessToken,
    adminApiFetch,
    queuePos,
    selectedLanguage,
    derived.quotaTitle,
    derived.answers,
    derived.dateStr,
    derived.eventId,
    derived.eventData,
  ]);

  return (
    <div className="email-preview-container">
      <h2>{t("editor.emails.verificationEmail.preview")}</h2>
      <p>{t("editor.emails.verificationEmail.preview.desc")}</p>
      <div className="email-preview-options">
        <ButtonGroup>
          <ToggleButton
            id="email-queue-pos-null"
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
      <div ref={wrapperRef} className="email-preview-frame-wrapper">
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