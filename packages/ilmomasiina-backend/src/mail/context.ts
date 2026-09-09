import { createContext } from "react";

import type { EmailAttachment } from "./config";

export interface EmailRenderContextValue {
  isSending: boolean;
  addAttachment: (attachment: Omit<EmailAttachment, "filename" | "cid">) => string;
}

export const EmailRenderContext = createContext<EmailRenderContextValue>({
  isSending: false,
  addAttachment: () => "img_1",
});
