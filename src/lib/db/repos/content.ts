import { execute, query, queryOne } from "@/lib/db/client";
import { contentKeys, findContentBlock } from "@/lib/cms/registry";
import { deleteById, json, nextPosition, reorderRow } from "@/lib/db/sql";
import { locales } from "@/i18n/config";
import type { FaqItemRow, LocalisedValue } from "@/lib/db/types";

/**
 * Editable website copy, and the FAQ.
 *
 * `content_block` holds only overrides. Reads always merge them over the copy
 * declared in `src/lib/cms/registry.ts`, so an unset — or deleted — key falls
 * back to what the site already publishes rather than rendering nothing.
 */

export type ContentOverrides = Map<string, LocalisedValue>;

/** Every override, as one map. The public read layer caches this. */
export async function contentOverrides(): Promise<ContentOverrides> {
  const rows = await query<{ key: string; value: LocalisedValue }>(
    "select key, value from content_block",
  );

  const map: ContentOverrides = new Map();
  for (const row of rows) {
    /* A row whose key is no longer declared is ignored rather than surfaced:
       it is a leftover from a renamed block, not content. */
    if (!contentKeys.includes(row.key)) continue;
    map.set(row.key, row.value);
  }
  return map;
}

/**
 * The value in force for one key: the override where a language has been
 * filled in, and the shipped copy everywhere else.
 *
 * Merged per language, not per key, so translating only the Albanian override
 * does not blank the English.
 */
export function resolveContent(
  key: string,
  overrides: ContentOverrides,
): LocalisedValue {
  const definition = findContentBlock(key);
  const fallback = definition?.fallback ?? {};
  const override = overrides.get(key);
  if (!override) return fallback;

  const merged: LocalisedValue = { ...fallback };
  for (const locale of locales) {
    const value = override[locale];
    if (value && value.trim() !== "") merged[locale] = value;
  }
  return merged;
}

/**
 * Saves one block's override.
 *
 * A language left empty is dropped from the stored object rather than saved as
 * "", which is what makes "clear this field to go back to the original" work.
 * When every language is empty the row is deleted outright.
 */
export async function setContentBlock(
  key: string,
  value: LocalisedValue,
): Promise<void> {
  if (!contentKeys.includes(key)) return;

  const cleaned: LocalisedValue = {};
  for (const locale of locales) {
    const text = value[locale]?.trim();
    if (text) cleaned[locale] = text;
  }

  if (Object.keys(cleaned).length === 0) {
    await execute("delete from content_block where key = $1", [key]);
    return;
  }

  await execute(
    `insert into content_block (key, value) values ($1, $2::jsonb)
     on conflict (key) do update
       set value = excluded.value, updated_at = now()`,
    [key, json(cleaned)],
  );
}

export async function resetContentBlock(key: string): Promise<void> {
  await execute("delete from content_block where key = $1", [key]);
}

export async function editedContentCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from content_block",
  );
  return Number(row?.count ?? 0);
}

// === FAQ ==================================================================

export async function listFaqItems(): Promise<FaqItemRow[]> {
  return query<FaqItemRow>(
    `select id, question, answer, is_active, position
       from faq_item order by position asc, id asc`,
  );
}

export async function activeFaqItems(): Promise<FaqItemRow[]> {
  return query<FaqItemRow>(
    `select id, question, answer, is_active, position
       from faq_item where is_active = true order by position asc, id asc`,
  );
}

export async function getFaqItem(id: string): Promise<FaqItemRow | null> {
  return queryOne<FaqItemRow>(
    `select id, question, answer, is_active, position from faq_item where id = $1`,
    [id],
  );
}

export async function faqCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from faq_item",
  );
  return Number(row?.count ?? 0);
}

export async function createFaqItem(input: {
  question: LocalisedValue;
  answer: LocalisedValue;
  isActive: boolean;
}): Promise<string> {
  const position = await nextPosition("faq_item");
  const row = await queryOne<{ id: string }>(
    `insert into faq_item (question, answer, is_active, position)
     values ($1::jsonb, $2::jsonb, $3, $4) returning id`,
    [json(input.question), json(input.answer), input.isActive, position],
  );
  return row?.id ?? "";
}

export async function updateFaqItem(
  id: string,
  input: { question: LocalisedValue; answer: LocalisedValue; isActive: boolean },
): Promise<void> {
  await execute(
    `update faq_item set question = $2::jsonb, answer = $3::jsonb,
            is_active = $4, updated_at = now()
      where id = $1`,
    [id, json(input.question), json(input.answer), input.isActive],
  );
}

export async function deleteFaqItem(id: string): Promise<boolean> {
  return deleteById("faq_item", id);
}

export async function moveFaqItem(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("faq_item", id, direction);
}
