import { FastifyReply, FastifyRequest } from "fastify";

import EmailService, { ConfirmationMailParams } from "../../../mail";
import { Event } from "../../../models/event";

export interface PreviewConfirmationBody {
  language?: string | null;
  params: Omit<ConfirmationMailParams, "event"> & {
    event?: string;
    eventData?: {
      title?: string;
      location?: string | null;
      verificationEmail?: string | null;
    };
  };
}

export const previewConfirmationBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    language: { type: ["string", "null"] },
    params: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        quota: { type: "string" },
        answers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              answer: { type: "string" },
            },
            required: ["label", "answer"],
          },
        },
        queuePosition: { type: ["integer", "null"] },
        type: { enum: ["signup", "edit"] },
        admin: { type: "boolean" },
        date: { type: ["string", "null"] },
        event: { type: "string" },
        eventData: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            location: { type: ["string", "null"] },
            verificationEmail: { type: ["string", "null"] },
          },
        },
        cancelLink: { type: "string" },
      },
      required: ["name", "email", "quota", "answers", "type", "admin", "date", "cancelLink"],
    },
  },
  required: ["params"],
} as const;

export const previewConfirmationResponse = {
  type: "object",
  additionalProperties: false,
  properties: {
    html: { type: "string" },
  },
  required: ["html"],
} as const;

export default async function preview(request: FastifyRequest<{ Body: PreviewConfirmationBody }>, reply: FastifyReply) {
  const { language = null, params } = request.body;

  let dbEvent: Event | null = null;
  if (params.event) {
    dbEvent = (await Event.findByPk(params.event)) || (await Event.findOne({ where: { slug: params.event } }));
  }

  const locale = (language && dbEvent?.languages?.[language]) || null;

  const title = params.eventData?.title || locale?.title || dbEvent?.title || "Tapahtuma";
  const location =
    params.eventData?.location !== undefined
      ? params.eventData.location
      : locale?.location !== undefined
        ? locale.location
        : dbEvent?.location ?? null;
  const verificationEmail =
    params.eventData?.verificationEmail !== undefined
      ? params.eventData.verificationEmail
      : locale?.verificationEmail !== undefined
        ? locale.verificationEmail
        : dbEvent?.verificationEmail ?? null;

  const event = {
    ...(dbEvent ? dbEvent.get({ plain: true }) : {}),
    title,
    location,
    verificationEmail,
  };

  const html =
    (await EmailService.createConfirmationEmailPreview(
      language,
      { ...params, event } as unknown as ConfirmationMailParams,
    )) ?? "<p>Email service failed to render a preview.</p>";
  return reply.send({ html });
}
