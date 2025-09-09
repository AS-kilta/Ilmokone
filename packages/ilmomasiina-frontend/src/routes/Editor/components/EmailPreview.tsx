import React, { useEffect, useMemo, useState } from "react";

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

const EmailPreview = () => {
  const { values } = useFormState<EditorEvent>();
  const { i18n } = useTranslation();
  const dispatch = useTypedDispatch();
  const accessToken = useTypedSelector((s) => s.auth.accessToken);

  const [admin, setAdmin] = useState(false);
  const [type, setType] = useState<MailType>("signup");
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derived = useMemo(() => {
    const title = values?.title || "";
    const location = values?.location ?? null;
    const verificationEmail = values?.verificationEmail ?? null;

    const quotaTitle = values?.quotas?.[0]?.title || "Quota";
    const answers = (values?.questions || []).map((q) => ({ label: q.question, answer: "—" }));

    const dateStr = values?.date ? values.date.toLocaleString(i18n.language || "fi-FI") : null;

    return { title, location, verificationEmail, quotaTitle, answers, dateStr };
  }, [values?.title,
    values?.location,
    values?.verificationEmail,
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
          language: i18n.language || null,
          params: {
            name: "Example User",
            email: "user@example.com",
            quota: derived.quotaTitle,
            answers: derived.answers,
            queuePosition: null,
            type,
            admin,
            date: derived.dateStr,
            event: {
              title: derived.title,
              location: derived.location,
              verificationEmail: derived.verificationEmail,
            },
            cancelLink: "https://as.fi",
          },
        };
        const resp = await adminApiFetch<PreviewResponse>(
          "admin/emails/preview/confirmation",
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
  }, [admin, type, derived, i18n.language, accessToken, dispatch]);

  return (
    <div>
      <div>
        <Form.Check
          type="switch"
          id="email-preview-admin"
          label="Admin"
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
            signup
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
            edit
          </ToggleButton>
        </ButtonGroup>
      </div>

      {loading && <div>Loading preview…</div>}
      {error && <div className="text-danger">{error}</div>}
      {!loading && !error && html && (
        // eslint-disable-next-line react/no-danger
        <div className="email-preview" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
};

export default EmailPreview;
