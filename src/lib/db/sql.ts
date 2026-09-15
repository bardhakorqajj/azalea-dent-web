import { execute, query, queryOne, transaction } from "./client";

/**
 * Small helpers the repositories share.
 */

/**
 * Serialises a value for a `jsonb` parameter.
 *
 * Always used explicitly, because the driver's own handling differs by type in
 * a way that is easy to get wrong: it turns a plain object into JSON, but a
 * JavaScript array into a *Postgres array literal* — so `['#a','#b']` bound to
 * a jsonb column fails rather than storing a JSON array. Stringifying here
 * makes objects and arrays behave the same.
 */
export function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Escapes the characters `LIKE` treats as wildcards, so a patient searching
 * for "50%" is not matched against everything.
 *
 * Paired with `ilike ... escape '\'` in the queries below.
 */
export function likeTerm(value: string): string {
  return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

/** Clamps a page number read from a query string. */
export function pageNumber(value: string | undefined, fallback = 1): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10_000) : fallback;
}

/**
 * Moves a row up or down within an ordered list.
 *
 * Positions are renumbered from scratch in one transaction rather than
 * swapping two values, because rows created at different times can share a
 * position (they all start at 0) and swapping equal values does nothing at
 * all. This always produces a strict order.
 */
export async function reorderRow(
  table: "service" | "team_member" | "treatment" | "promotion" | "review" | "gallery_image" | "faq_item" | "gallery_category",
  id: string,
  direction: "up" | "down",
): Promise<void> {
  await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      /* Table names come from the union type above, never from a request. */
      `select id from ${table} order by position asc, created_at asc`,
    );

    const order = rows.map((row) => row.id);
    const index = order.indexOf(id);
    if (index === -1) return;

    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= order.length) return;

    const moved = order[index] as string;
    order[index] = order[target] as string;
    order[target] = moved;

    for (const [position, rowId] of order.entries()) {
      await client.query(`update ${table} set position = $1 where id = $2`, [
        position,
        rowId,
      ]);
    }
  });
}

/** The next position at the end of an ordered list. */
export async function nextPosition(
  table: "service" | "team_member" | "treatment" | "promotion" | "review" | "gallery_image" | "faq_item" | "gallery_category",
): Promise<number> {
  const row = await queryOne<{ next: string }>(
    `select coalesce(max(position) + 1, 0)::text as next from ${table}`,
  );
  return Number(row?.next ?? 0);
}

/**
 * Whether a slug is free, optionally ignoring the row being edited.
 *
 * The unique index is the real guard; this exists so the form can say which
 * field is wrong instead of showing a database error.
 */
export async function slugAvailable(
  table: "service" | "team_member" | "treatment" | "promotion" | "gallery_category",
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `select id from ${table} where slug = $1 and ($2::uuid is null or id <> $2) limit 1`,
    [slug, exceptId ?? null],
  );
  return rows.length === 0;
}

/** Deletes one row by id, reporting whether it was there. */
export async function deleteById(
  table:
    | "service"
    | "team_member"
    | "treatment"
    | "patient"
    | "patient_treatment"
    | "appointment"
    | "social_post"
    | "promotion"
    | "review"
    | "gallery_image"
    | "gallery_category"
    | "faq_item"
    | "message",
  id: string,
): Promise<boolean> {
  const changed = await execute(`delete from ${table} where id = $1`, [id]);
  return changed > 0;
}

/**
 * A uuid, or null. Route parameters and form fields arrive as strings, and
 * feeding a non-uuid to a uuid column raises a database error rather than
 * simply not matching — so ids are checked before they reach a query.
 */
export function asUuid(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
