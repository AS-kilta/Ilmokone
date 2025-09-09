// filepath: packages/ilmomasiina-backend/src/routes/admin/emails/previewConfirmation.ts
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { FastifyReply, FastifyRequest } from "fastify";

import EmailService from "../../../mail";

export const previewConfirmationBody = Type.Object({
  language: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  params: Type.Object({
    name: Type.String(),
    email: Type.String(),
    quota: Type.String(),
    answers: Type.Array(
      Type.Object({
        label: Type.String(),
        answer: Type.String(),
      }),
    ),
    queuePosition: Type.Union([Type.Integer(), Type.Null()]),
    type: Type.Union([Type.Literal("signup"), Type.Literal("edit")]),
    admin: Type.Boolean(),
    date: Type.Union([Type.String(), Type.Null()]),
    event: Type.Object({
      title: Type.String(),
      location: Type.Union([Type.String(), Type.Null()]),
      verificationEmail: Type.Union([Type.String(), Type.Null()]),
    }),
    cancelLink: Type.String(),
  }),
});

export type PreviewConfirmationBody = Static<typeof previewConfirmationBody>;

export const previewConfirmationResponse = Type.Object({
  html: Type.String(),
});

export default async function preview(
  req: FastifyRequest<{ Body: { language?: string | null; params: any } }>,
  reply: FastifyReply,
) {
  const { language = null, params } = req.body;
  const html =
    (await EmailService.createConfirmationEmailPreview(language, params)) ?? "<p>Failed to render preview.</p>";
  reply.send({ html });
}
