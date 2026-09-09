import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, nextPosition, reorderRow, slugAvailable } from "@/lib/db/sql";
import type { LocalisedValue, PromotionRow } from "@/lib/db/types";

/**
 * Promotions.
 *
 * A promotion reaches the public website only when it is switched on *and*
 * today falls inside its dates — so the clinic can prepare an offer in advance
 * and have it appear and disappear on its own. `livePromotions` is the query
 * the website uses, and it is the only place that rule is written down.
 */

const SELECT = `
  id, slug, title, description, discount_text, cta_label, cta_href,
  image_id::text as image_id,
  to_char(starts_on, 'YYYY-MM-DD') as starts_on,
  to_char(ends_on, 'YYYY-MM-DD') as ends_on,
  is_active, position, created_at, updated_at
`;

export async function listPromotions(): Promise<PromotionRow[]> {
  return query<PromotionRow>(
    `select ${SELECT} from promotion order by position asc, created_at desc`,
  );
}

/** Active, and inside its window. What the public site shows. */
export async function livePromotions(): Promise<PromotionRow[]> {
  return query<PromotionRow>(
    `select ${SELECT} from promotion
      where is_active = true
        and (starts_on is null or starts_on <= current_date)
        and (ends_on   is null or ends_on   >= current_date)
      order by position asc, created_at desc`,
  );
}

export async function getPromotion(id: string): Promise<PromotionRow | null> {
  return queryOne<PromotionRow>(`select ${SELECT} from promotion where id = $1`, [id]);
}

export async function activePromotionCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `select count(*)::text as count from promotion
      where is_active = true
        and (starts_on is null or starts_on <= current_date)
        and (ends_on   is null or ends_on   >= current_date)`,
  );
  return Number(row?.count ?? 0);
}

/** Which of the four states a promotion is in, for the badge in the list. */
export type PromotionState = "live" | "scheduled" | "expired" | "draft";

export function promotionState(row: PromotionRow, today = new Date()): PromotionState {
  if (!row.is_active) return "draft";

  const iso = today.toISOString().slice(0, 10);
  if (row.starts_on && row.starts_on > iso) return "scheduled";
  if (row.ends_on && row.ends_on < iso) return "expired";
  return "live";
}

export type PromotionInput = {
  slug: string;
  title: LocalisedValue;
  description: LocalisedValue;
  discountText: LocalisedValue;
  ctaLabel: LocalisedValue;
  ctaHref: string | null;
  imageId: string | null;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
};

export async function createPromotion(input: PromotionInput): Promise<string> {
  const position = await nextPosition("promotion");

  const row = await queryOne<{ id: string }>(
    `insert into promotion (
       slug, title, description, discount_text, cta_label, cta_href,
       image_id, starts_on, ends_on, is_active, position
     ) values (
       $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6,
       $7::uuid, $8::date, $9::date, $10, $11
     ) returning id`,
    [
      input.slug,
      json(input.title),
      json(input.description),
      json(input.discountText),
      json(input.ctaLabel),
      input.ctaHref,
      input.imageId,
      input.startsOn,
      input.endsOn,
      input.isActive,
      position,
    ],
  );
  return row?.id ?? "";
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<void> {
  await execute(
    `update promotion set
       slug = $2, title = $3::jsonb, description = $4::jsonb,
       discount_text = $5::jsonb, cta_label = $6::jsonb, cta_href = $7,
       image_id = $8::uuid, starts_on = $9::date, ends_on = $10::date,
       is_active = $11, updated_at = now()
     where id = $1`,
    [
      id,
      input.slug,
      json(input.title),
      json(input.description),
      json(input.discountText),
      json(input.ctaLabel),
      input.ctaHref,
      input.imageId,
      input.startsOn,
      input.endsOn,
      input.isActive,
    ],
  );
}

export async function togglePromotionActive(id: string): Promise<boolean> {
  const row = await queryOne<{ is_active: boolean }>(
    `update promotion set is_active = not is_active, updated_at = now()
      where id = $1 returning is_active`,
    [id],
  );
  return row?.is_active ?? false;
}

export async function deletePromotion(id: string): Promise<boolean> {
  return deleteById("promotion", id);
}

export async function movePromotion(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("promotion", id, direction);
}

export async function promotionSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  return slugAvailable("promotion", slug, exceptId);
}
