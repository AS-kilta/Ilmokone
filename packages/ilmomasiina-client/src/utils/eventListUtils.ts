import every from "lodash-es/every";
import sumBy from "lodash-es/sumBy";

import type {
  EventID,
  EventSlug,
  QuotaID,
  UserEventListItem,
  UserEventListResponse,
} from "@tietokilta/ilmomasiina-models";
import { SignupState, signupState, SignupStateInfo } from "./signupState";

export interface EventTableOptions {
  /** If true, quotas are not placed on separate rows. */
  compact?: boolean;
}

export type EventRow = {
  id: EventID;
  type: "event";
  slug: EventSlug;
  title: string;
  date: Date | null;
  signupState: SignupStateInfo;
  signupCount?: number;
  quotaSize?: number | null;
  totalSignupCount: number;
  totalQuotaSize: number | null;
};
export type QuotaRow = {
  type: "quota" | "openquota" | "waitlist";
  id: QuotaID;
  title?: string;
  signupCount: number;
  quotaSize: number | null;
};
export type TableRow = EventRow | QuotaRow;

/** Converts an event to rows to be shown in the event list. */
export function eventToRows(event: UserEventListItem, { compact }: EventTableOptions = {}) {
  const {
    id,
    slug,
    title,
    date,
    registrationStartDate,
    registrationEndDate,
    quotas,
    openQuotaSize,
    hideQuotaSizes,
  } = event;
  const state = signupState(registrationStartDate, registrationEndDate);

  let quotaSize: number | null | undefined;
  if (!hideQuotaSizes && quotas.length === 1) {
    quotaSize = quotas[0].size;
  }

  let totalQuotaSize: number | null = null;
  if (!hideQuotaSizes && every(quotas, "size")) {
    totalQuotaSize = sumBy(quotas, "size");
  }

  // Event row
  const rows: TableRow[] = [
    {
      type: "event",
      id,
      signupState: state,
      slug,
      title,
      date: date ? new Date(date) : null,
      signupCount: quotas.length < 2 ? sumBy(quotas, "signupCount") : undefined,
      quotaSize,
      totalSignupCount: sumBy(quotas, "signupCount") ?? 0,
      totalQuotaSize,
    },
  ];

  // We're done for compact format and events without a signup
  if (compact || state.state === SignupState.disabled) return rows;

  // Multiple quotas go on their own rows
  if (quotas.length > 1) {
    quotas.forEach((quota) =>
      rows.push({
        type: "quota",
        id: quota.id,
        title: quota.title,
        signupCount: !hideQuotaSizes && quota.size ? Math.min(quota.signupCount, quota.size) : quota.signupCount,
        quotaSize: hideQuotaSizes ? null : quota.size,
      }),
    );
  }

  const overflow = sumBy(quotas, (quota) => (quota.size ? Math.max(0, quota.signupCount - quota.size) : 0));

  // Open quota
  if (!hideQuotaSizes && openQuotaSize > 0) {
    rows.push({
      type: "openquota",
      id: `${event.id} openquota`,
      signupCount: Math.min(overflow, openQuotaSize),
      quotaSize: openQuotaSize,
    });
  }

  // Queue/waitlist
  if (overflow > openQuotaSize) {
    rows.push({
      type: "waitlist",
      id: `${event.id} waitlist`,
      signupCount: overflow - openQuotaSize,
      quotaSize: null,
    });
  }

  return rows;
}

/** Converts a list of events to a flat list of rows to be shown in the event list. */
export function eventsToRows(events: UserEventListResponse, options?: EventTableOptions) {
  return events.flatMap((event) => eventToRows(event, options));
}
