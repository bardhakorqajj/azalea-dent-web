import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, likeTerm, nextPosition, reorderRow, slugAvailable } from "@/lib/db/sql";
import { toPage, type LocalisedList, type LocalisedValue, type Page, type ServiceRow } from "@/lib/db/types";

/**
 * Services — the areas of treatment the public website lists.
 *
 * These rows are what the public service pages render, so `is_active` is a
 * publish switch: an inactive service disappears from the website but keeps
 * its row, its slug and any appointments that refer to it.
 */

const PER_PAGE = 25;

const SELECT = `
  id, slug, title, summary, body, highlights, price_text, duration_minutes,
  image_id::text as image_id, seo_title, seo_description,
  is_active, is_featured, position, created_at, updated_at
`;

export async function listServices(filters: {
  search?: string;
  activeOnly?: boolean;
  page?: number;
} = {}): Promise<Page<ServiceRow>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    /* Searches every language at once: the jsonb value is cast to text so one
       term finds a service by its Albanian or its English name. */
    conditions.push(`(slug ilike ${p} escape '\\' or title::text ilike ${p} escape '\\')`);
  }

  if (filters.activeOnly) conditions.push("is_active = true");

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from service ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);
  const page = Math.max(1, filters.page ?? 1);

  const rows = await query<ServiceRow>(
    `select ${SELECT} from service ${where}
      order by position asc, created_at asc
      limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    params,
  );

  return toPage(rows, total, page, PER_PAGE);
}

/** Every active service, ordered — what the public website reads. */
export async function activeServices(): Promise<ServiceRow[]> {
  return query<ServiceRow>(
    `select ${SELECT} from service where is_active = true
      order by position asc, created_at asc`,
  );
}

export async function allServices(): Promise<ServiceRow[]> {
  return query<ServiceRow>(
    `select ${SELECT} from service order by position asc, created_at asc`,
  );
}

export async function getService(id: string): Promise<ServiceRow | null> {
  return queryOne<ServiceRow>(`select ${SELECT} from service where id = $1`, [id]);
}

export async function getServiceBySlug(slug: string): Promise<ServiceRow | null> {
  return queryOne<ServiceRow>(`select ${SELECT} from service where slug = $1`, [slug]);
}

export async function serviceCount(): Promise<number> {
  const row = await queryOne<{ count: string }>("select count(*)::text as count from service");
  return Number(row?.count ?? 0);
}

export type ServiceInput = {
  slug: string;
  title: LocalisedValue;
  summary: LocalisedValue;
  body: LocalisedValue;
  highlights: LocalisedList;
  priceText: LocalisedValue;
  durationMinutes: number | null;
  imageId: string | null;
  seoTitle: LocalisedValue;
  seoDescription: LocalisedValue;
  isActive: boolean;
  isFeatured: boolean;
};

export async function createService(input: ServiceInput): Promise<string> {
  const position = await nextPosition("service");

  const row = await queryOne<{ id: string }>(
    `insert into service (
       slug, title, summary, body, highlights, price_text, duration_minutes,
       image_id, seo_title, seo_description, is_active, is_featured, position
     ) values (
       $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7,
       $8::uuid, $9::jsonb, $10::jsonb, $11, $12, $13
     ) returning id`,
    [
      input.slug,
      json(input.title),
      json(input.summary),
      json(input.body),
      json(input.highlights),
      json(input.priceText),
      input.durationMinutes,
      input.imageId,
      json(input.seoTitle),
      json(input.seoDescription),
      input.isActive,
      input.isFeatured,
      position,
    ],
  );

  return row?.id ?? "";
}

export async function updateService(id: string, input: ServiceInput): Promise<void> {
  await execute(
    `update service set
       slug = $2, title = $3::jsonb, summary = $4::jsonb, body = $5::jsonb,
       highlights = $6::jsonb, price_text = $7::jsonb, duration_minutes = $8,
       image_id = $9::uuid, seo_title = $10::jsonb, seo_description = $11::jsonb,
       is_active = $12, is_featured = $13, updated_at = now()
     where id = $1`,
    [
      id,
      input.slug,
      json(input.title),
      json(input.summary),
      json(input.body),
      json(input.highlights),
      json(input.priceText),
      input.durationMinutes,
      input.imageId,
      json(input.seoTitle),
      json(input.seoDescription),
      input.isActive,
      input.isFeatured,
    ],
  );
}

export async function toggleServiceActive(id: string): Promise<void> {
  await execute(
    "update service set is_active = not is_active, updated_at = now() where id = $1",
    [id],
  );
}

export async function deleteService(id: string): Promise<boolean> {
  return deleteById("service", id);
}

export async function moveService(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("service", id, direction);
}

export async function serviceSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  return slugAvailable("service", slug, exceptId);
}

/** Compact list for the select boxes on appointment and treatment forms. */
export async function serviceOptions(): Promise<{ id: string; slug: string; title: LocalisedValue }[]> {
  return query<{ id: string; slug: string; title: LocalisedValue }>(
    "select id, slug, title from service order by position asc, created_at asc",
  );
}
