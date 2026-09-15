import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, likeTerm, nextPosition, reorderRow, slugAvailable } from "@/lib/db/sql";
import { toPage, type LocalisedValue, type Page, type TreatmentRow } from "@/lib/db/types";

/**
 * Treatments — the specific procedures inside a service.
 *
 * "Zirconia crown" is a treatment; "prosthetics" is the service it belongs to.
 * The link is optional so a treatment can be written down before it is filed
 * under a service, and it survives the service being deleted.
 */

const PER_PAGE = 25;

const SELECT = `
  t.id, t.slug, t.service_id::text as service_id, t.title, t.summary, t.body,
  t.price_text, t.duration_minutes, t.image_id::text as image_id,
  t.is_active, t.is_featured, t.position, t.created_at, t.updated_at
`;

export type TreatmentWithService = TreatmentRow & {
  service_title: LocalisedValue | null;
};

export async function listTreatments(filters: {
  search?: string;
  serviceId?: string;
  page?: number;
} = {}): Promise<Page<TreatmentWithService>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    conditions.push(`(t.slug ilike ${p} escape '\\' or t.title::text ilike ${p} escape '\\')`);
  }

  if (filters.serviceId) {
    params.push(filters.serviceId);
    conditions.push(`t.service_id = $${params.length}::uuid`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from treatment t ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);
  const page = Math.max(1, filters.page ?? 1);

  const rows = await query<TreatmentWithService>(
    `select ${SELECT}, s.title as service_title
       from treatment t
       left join service s on s.id = t.service_id
       ${where}
      order by t.position asc, t.created_at asc
      limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    params,
  );

  return toPage(rows, total, page, PER_PAGE);
}

export async function activeTreatments(): Promise<TreatmentWithService[]> {
  return query<TreatmentWithService>(
    `select ${SELECT}, s.title as service_title
       from treatment t
       left join service s on s.id = t.service_id
      where t.is_active = true
      order by t.position asc, t.created_at asc`,
  );
}

export async function treatmentsForService(serviceId: string): Promise<TreatmentRow[]> {
  return query<TreatmentRow>(
    `select ${SELECT} from treatment t
      where t.service_id = $1::uuid and t.is_active = true
      order by t.position asc, t.created_at asc`,
    [serviceId],
  );
}

export async function getTreatment(id: string): Promise<TreatmentRow | null> {
  return queryOne<TreatmentRow>(`select ${SELECT} from treatment t where t.id = $1`, [id]);
}

export async function treatmentCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from treatment",
  );
  return Number(row?.count ?? 0);
}

export type TreatmentInput = {
  slug: string;
  serviceId: string | null;
  title: LocalisedValue;
  summary: LocalisedValue;
  body: LocalisedValue;
  priceText: LocalisedValue;
  durationMinutes: number | null;
  imageId: string | null;
  isActive: boolean;
  isFeatured: boolean;
};

export async function createTreatment(input: TreatmentInput): Promise<string> {
  const position = await nextPosition("treatment");

  const row = await queryOne<{ id: string }>(
    `insert into treatment (
       slug, service_id, title, summary, body, price_text, duration_minutes,
       image_id, is_active, is_featured, position
     ) values (
       $1, $2::uuid, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7,
       $8::uuid, $9, $10, $11
     ) returning id`,
    [
      input.slug,
      input.serviceId,
      json(input.title),
      json(input.summary),
      json(input.body),
      json(input.priceText),
      input.durationMinutes,
      input.imageId,
      input.isActive,
      input.isFeatured,
      position,
    ],
  );

  return row?.id ?? "";
}

export async function updateTreatment(id: string, input: TreatmentInput): Promise<void> {
  await execute(
    `update treatment set
       slug = $2, service_id = $3::uuid, title = $4::jsonb, summary = $5::jsonb,
       body = $6::jsonb, price_text = $7::jsonb, duration_minutes = $8,
       image_id = $9::uuid, is_active = $10, is_featured = $11, updated_at = now()
     where id = $1`,
    [
      id,
      input.slug,
      input.serviceId,
      json(input.title),
      json(input.summary),
      json(input.body),
      json(input.priceText),
      input.durationMinutes,
      input.imageId,
      input.isActive,
      input.isFeatured,
    ],
  );
}

export async function deleteTreatment(id: string): Promise<boolean> {
  return deleteById("treatment", id);
}

export async function moveTreatment(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("treatment", id, direction);
}

export async function treatmentSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
  return slugAvailable("treatment", slug, exceptId);
}

export async function treatmentOptions(): Promise<{ id: string; title: LocalisedValue }[]> {
  return query<{ id: string; title: LocalisedValue }>(
    "select id, title from treatment order by position asc, created_at asc",
  );
}
