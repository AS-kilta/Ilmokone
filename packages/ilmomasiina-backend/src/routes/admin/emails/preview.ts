import { FastifyReply, FastifyRequest } from "fastify";

import EmailService, { ConfirmationMailParams } from "../../../mail";
import { Event } from "../../../models/event";

export interface PreviewConfirmationBody {
  language?: string | null;
  params: Omit<ConfirmationMailParams, "event"> & { event: string };
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
        cancelLink: { type: "string" },
      },
      required: [
        "name",
        "email",
        "quota",
        "answers",
        "queuePosition",
        "type",
        "admin",
        "date",
        "event",
        "cancelLink",
      ],
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

export default async function preview(
  request: FastifyRequest<{ Body: PreviewConfirmationBody }>,
  reply: FastifyReply,
) {

  const { language = null, params } = request.body;

  // Resolve event id or slug to an Event instance for the template
  const eventIdOrSlug = params.event;
  const event =
    (await Event.findByPk(eventIdOrSlug)) || (await Event.findOne({ where: { slug: eventIdOrSlug } }));

  if (!event) {
    reply.status(400);
    return reply.send({ error: "Invalid event id or slug" });
  }

  const html =
    (await EmailService.createConfirmationEmailPreview(language, { ...params, event } as ConfirmationMailParams)) ??
    "<p>Email service failed to render a preview.</p>";
  return reply.send({ html });
}
