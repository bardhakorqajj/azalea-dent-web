import { execute, query, queryOne } from "@/lib/db/client";
import { json } from "@/lib/db/sql";
import type { ActivityRow } from "@/lib/db/types";

/**
 * The record of what actually happened.
 *
 * This is what the dashboard's notifications and "recent activity" panels
 * read. Nothing is ever written here that did not occur — an appointment
 * request arriving, a message coming in, a promotion being switched on. That
 * is the whole point: a panel with nothing in it means nothing happened, not
 * that the feature is unfinished.
 */

export type ActivityKind =
  | "appointment.requested"
  | "appointment.created"
  | "appointment.status_changed"
  | "message.received"
  | "review.published"
  | "promotion.activated"
  | "social.approved"
  | "content.updated";

export async function logActivity(entry: {
  kind: ActivityKind;
  summary: string;
  entity?: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await execute(
      `insert into activity (kind, entity, entity_id, summary, meta)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [
        entry.kind,
        entry.entity ?? null,
        entry.entityId ?? null,
        entry.summary.slice(0, 500),
        json(entry.meta ?? {}),
      ],
    );
  } catch (error) {
    /* The log is a convenience, not the transaction. A patient's appointment
       request must not fail because the activity row could not be written. */
    console.error("Writing an activity entry failed:", error);
  }
}

export async function recentActivity(limit = 12): Promise<ActivityRow[]> {
  return query<ActivityRow>(
    `select id::text as id, kind, entity, entity_id::text as entity_id,
            summary, meta, read_at, created_at
       from activity
      order by created_at desc
      limit $1`,
    [Math.min(limit, 100)],
  );
}

export async function unreadActivityCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from activity where read_at is null",
  );
  return Number(row?.count ?? 0);
}

/**
 * Where a notification should take the reader. Derived from the entity rather
 * than stored, so a link never rots when a route is renamed.
 */
export function activityHref(row: ActivityRow): string | null {
  if (row.entity === "appointment" && row.entity_id) {
    return `/appointments/${row.entity_id}`;
  }
  if (row.entity === "message" && row.entity_id) return `/messages/${row.entity_id}`;
  if (row.entity === "review") return "/reviews";
  if (row.entity === "promotion") return "/promotions";
  if (row.entity === "social_post") return "/social";
  return null;
}
