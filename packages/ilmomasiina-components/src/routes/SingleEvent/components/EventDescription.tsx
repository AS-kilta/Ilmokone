import React, { useContext } from "react";

import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { linkComponent } from "../../../config/router";
import { usePaths } from "../../../contexts";
import AuthContext from "../../../contexts/auth";
import { useSingleEventContext } from "../../../modules/singleEvent";
import { useEventDateTimeFormatter } from "../../../utils/dateFormat";
import CCTextEn from "../CCTextEn";
import CCTextFi from "../CCTextFi";

const EventDescription = () => {
  const event = useSingleEventContext().event!;
  const { preview } = useSingleEventContext();
  const { loggedIn } = useContext(AuthContext);
  const Link = linkComponent();
  const paths = usePaths();
  const { t, i18n } = useTranslation();
  const eventDateFormat = useEventDateTimeFormatter();
  const ccText = i18n.language === "en" ? CCTextEn : CCTextFi;

  return (
    <>
      <nav className="ilmo--title-nav">
        <h1>{event.title}</h1>
        {loggedIn && !preview && paths.hasAdmin && (
          <Button as={Link} variant="primary" to={paths.adminEditEvent(event.id)}>
            {t("singleEvent.editEvent")}
          </Button>
        )}
      </nav>
      <div className="ilmo--event-heading">
        {event.category && (
          <p>
            <strong>{t("singleEvent.info.category")}</strong> {event.category}
          </p>
        )}
        {event.date && (
          <p>
            <strong>{event.endDate ? t("singleEvent.info.startDate") : t("singleEvent.info.date")}</strong>{" "}
            {eventDateFormat.format(new Date(event.date))}
          </p>
        )}
        {event.endDate && (
          <p>
            <strong>{t("singleEvent.info.endDate")}</strong> {eventDateFormat.format(new Date(event.endDate))}
          </p>
        )}
        {event.location && (
          <p>
            <strong>{t("singleEvent.info.location")}</strong> {event.location}
          </p>
        )}
        {event.price && (
          <p>
            <strong>{t("singleEvent.info.price")}</strong> {event.price}
          </p>
        )}
        {event.bankId && (
          <p>
            <strong>{t("singleEvent.info.message")}</strong> {event.bankId}
          </p>
        )}
        {event.receiver && (
          <p>
            <strong>{t("singleEvent.info.receiver")}</strong> {event.receiver}
          </p>
        )}
        {event.message && (
          <p>
            <strong>{t("singleEvent.info.message")}</strong> {event.message}
          </p>
        )}
        {event.paymentBarcode && (
          <p>
            <strong>{t("singleEvent.info.paymentBarcode")}</strong> {event.paymentBarcode}
            <br />
            <Button variant="primary" onClick={() => {navigator.clipboard.writeText(event.paymentBarcode)}}>
            {t("singleEvent.copyBarcode")}
            </Button>
          </p>
        )}
        {event.webpageUrl && (
          <p>
            <strong>{t("singleEvent.info.website")}</strong>{" "}
            <a href={event.webpageUrl} title={t("singleEvent.info.website")}>
              {event.webpageUrl}
            </a>
          </p>
        )}
        {event.facebookUrl && (
          <p>
            <strong>{t("singleEvent.info.facebookEvent")}</strong>{" "}
            <a href={event.facebookUrl} title={t("singleEvent.info.facebookEvent")}>
              {event.facebookUrl}
            </a>
          </p>
        )}
      </div>
      <div className="ilmo--event-description">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description || ""}</ReactMarkdown>
      </div>
      <div className="ilmo--cc-text">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {ccText}
        </ReactMarkdown>
      </div>
    </>
  );
};

export default EventDescription;
