import { createHash } from "node:crypto";

import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, likeTerm } from "@/lib/db/sql";
import {
  toPage,
  type MessageRow,
  type MessageSource,
  type MessageStatus,
  type Page,
} from "@/lib/db/types";

/**
 * The contact inbox.
 *
 * Messages arrive from the public site's contact form and are worked through
 * here. The sender's IP is stored only as a hash — enough to spot a flood of
 * spam from one address, not a record of who visited the site.
 */

const PER_PAGE = 20;

export type MessageFilters = {
  search?: string;
  status?: MessageStatus | "all";
  unreadOnly?: boolean;
  page?: number;
};

export async function listMessages(filters: MessageFilters = {}): Promise<Page<MessageRow>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    conditions.push(
      `(name ilike ${p} escape '\\' or email ilike ${p} escape '\\'
        or phone ilike ${p} escape '\\' or subject ilike ${p} escape '\\'
        or body ilike ${p} escape '\\')`,
    );
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.unreadOnly) conditions.push("is_read = false");

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from message ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);

  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * PER_PAGE;

  const rows = await query<MessageRow>(
    `select id, name, email, phone, subject, body, source, locale,
            is_read, status, created_at, updated_at
       from message
       ${where}
      order by created_at desc
      limit ${PER_PAGE} offset ${offset}`,
    params,
  );

  return toPage(rows, total, page, PER_PAGE);
}

export async function getMessage(id: string): Promise<MessageRow | null> {
  return queryOne<MessageRow>(
    `select id, name, email, phone, subject, body, source, locale,
            is_read, status, created_at, updated_at
       from message where id = $1`,
    [id],
  );
}

export async function unreadMessageCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from message where is_read = false and status <> 'spam'",
  );
  return Number(row?.count ?? 0);
}

export async function recentMessages(limit = 5): Promise<MessageRow[]> {
  return query<MessageRow>(
    `select id, name, email, phone, subject, body, source, locale,
            is_read, status, created_at, updated_at
       from message
      where status <> 'spam'
      order by created_at desc
      limit $1`,
    [limit],
  );
}

export async function createMessage(input: {
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  source?: MessageSource;
  locale?: string | null;
  ip?: string | null;
}): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into message (name, email, phone, subject, body, source, locale, ip_hash)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [
      input.name,
      input.email,
      input.phone,
      input.subject,
      input.body,
      input.source ?? "website",
      input.locale ?? null,
      hashIp(input.ip),
    ],
  );
  return row?.id ?? "";
}

export async function updateMessage(
  id: string,
  changes: { status?: MessageStatus; isRead?: boolean },
): Promise<void> {
  await execute(
    `update message
        set status  = coalesce($2, status),
            is_read = coalesce($3, is_read),
            updated_at = now()
      where id = $1`,
    [id, changes.status ?? null, changes.isRead ?? null],
  );
}

export async function markMessageRead(id: string): Promise<void> {
  await execute(
    "update message set is_read = true, updated_at = now() where id = $1 and is_read = false",
    [id],
  );
}

export async function deleteMessage(id: string): Promise<boolean> {
  return deleteById("message", id);
}

/** Counts per day, for the analytics chart. */
export async function messagesPerDay(
  days: number,
): Promise<{ day: string; count: number }[]> {
  const rows = await query<{ day: string; count: string }>(
    `select to_char(created_at::date, 'YYYY-MM-DD') as day, count(*)::text as count
       from message
      where created_at >= current_date - ($1::int - 1)
      group by 1
      order by 1`,
    [days],
  );
  return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
}

function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip.trim() === "") return null;
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
}
