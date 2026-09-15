import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, nextPosition, reorderRow, slugAvailable } from "@/lib/db/sql";
import type {
  GalleryCategoryRow,
  GalleryImageRow,
  GalleryKind,
  LocalisedValue,
  MediaRow,
} from "@/lib/db/types";

/**
 * The gallery.
 *
 * One privacy rule runs through all of it: a photograph of a treatment
 * (`kind = 'work'`) is a photograph of a patient's mouth, and it cannot be
 * published until the clinic has recorded that written consent is on file.
 * That is enforced by a check constraint in the schema, not only by the form —
 * see `gallery_work_needs_consent` in the migration — so no code path,
 * including a future import, can publish one without it.
 */

const SELECT = `
  g.id, g.media_id::text as media_id, g.category_id::text as category_id,
  g.alt, g.caption, g.kind, g.consent_on_file, g.is_published, g.is_featured,
  g.position, g.created_at, g.updated_at
`;

export type GalleryImageWithMedia = GalleryImageRow & {
  filename: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  category_name: LocalisedValue | null;
};

const JOINED = `
  ${SELECT},
  m.filename, m.mime_type, m.byte_size, m.width, m.height,
  c.name as category_name
  from gallery_image g
  join media m            on m.id = g.media_id
  left join gallery_category c on c.id = g.category_id
`;

export async function listGalleryImages(filters: {
  categoryId?: string;
  kind?: GalleryKind | "all";
  publishedOnly?: boolean;
} = {}): Promise<GalleryImageWithMedia[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.categoryId) {
    params.push(filters.categoryId);
    conditions.push(`g.category_id = $${params.length}::uuid`);
  }
  if (filters.kind && filters.kind !== "all") {
    params.push(filters.kind);
    conditions.push(`g.kind = $${params.length}`);
  }
  if (filters.publishedOnly) conditions.push("g.is_published = true");

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  return query<GalleryImageWithMedia>(
    `select ${JOINED} ${where}
      order by g.is_featured desc, g.position asc, g.created_at asc`,
    params,
  );
}

/** What the public gallery reads. */
export async function publishedGalleryImages(): Promise<GalleryImageWithMedia[]> {
  return listGalleryImages({ publishedOnly: true });
}

export async function getGalleryImage(id: string): Promise<GalleryImageWithMedia | null> {
  return queryOne<GalleryImageWithMedia>(`select ${JOINED} where g.id = $1`, [id]);
}

export async function galleryCounts(): Promise<{
  total: number;
  published: number;
  awaitingConsent: number;
}> {
  const row = await queryOne<{
    total: string;
    published: string;
    awaiting: string;
  }>(
    `select count(*)::text as total,
            count(*) filter (where is_published = true)::text as published,
            count(*) filter (
              where kind = 'work' and consent_on_file = false
            )::text as awaiting
       from gallery_image`,
  );
  return {
    total: Number(row?.total ?? 0),
    published: Number(row?.published ?? 0),
    awaitingConsent: Number(row?.awaiting ?? 0),
  };
}

export type GalleryImageInput = {
  categoryId: string | null;
  alt: LocalisedValue;
  caption: LocalisedValue;
  kind: GalleryKind;
  consentOnFile: boolean;
  isPublished: boolean;
  isFeatured: boolean;
};

/**
 * Whether this combination is allowed to be stored.
 *
 * Checked before the insert so the form can explain itself; the database
 * refuses it regardless.
 */
export function galleryConsentSatisfied(input: {
  kind: GalleryKind;
  isPublished: boolean;
  consentOnFile: boolean;
}): boolean {
  if (input.kind !== "work") return true;
  if (!input.isPublished) return true;
  return input.consentOnFile;
}

export async function createGalleryImage(
  mediaId: string,
  input: GalleryImageInput,
): Promise<string> {
  const position = await nextPosition("gallery_image");

  const row = await queryOne<{ id: string }>(
    `insert into gallery_image (
       media_id, category_id, alt, caption, kind, consent_on_file,
       is_published, is_featured, position
     ) values ($1::uuid, $2::uuid, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9)
     returning id`,
    [
      mediaId,
      input.categoryId,
      json(input.alt),
      json(input.caption),
      input.kind,
      input.consentOnFile,
      input.isPublished,
      input.isFeatured,
      position,
    ],
  );
  return row?.id ?? "";
}

export async function updateGalleryImage(
  id: string,
  input: GalleryImageInput,
): Promise<void> {
  await execute(
    `update gallery_image set
       category_id = $2::uuid, alt = $3::jsonb, caption = $4::jsonb, kind = $5,
       consent_on_file = $6, is_published = $7, is_featured = $8, updated_at = now()
     where id = $1`,
    [
      id,
      input.categoryId,
      json(input.alt),
      json(input.caption),
      input.kind,
      input.consentOnFile,
      input.isPublished,
      input.isFeatured,
    ],
  );
}

/**
 * Publishes or unpublishes one image.
 *
 * Unpublishing always works. Publishing a treatment photograph without
 * recorded consent is refused here and returns false, rather than letting the
 * check constraint raise — so the dashboard can say why.
 */
export async function toggleGalleryPublished(id: string): Promise<boolean> {
  const current = await queryOne<{
    is_published: boolean;
    kind: GalleryKind;
    consent_on_file: boolean;
  }>("select is_published, kind, consent_on_file from gallery_image where id = $1", [id]);

  if (!current) return false;

  const next = !current.is_published;
  if (
    next &&
    !galleryConsentSatisfied({
      kind: current.kind,
      isPublished: true,
      consentOnFile: current.consent_on_file,
    })
  ) {
    return false;
  }

  await execute(
    "update gallery_image set is_published = $2, updated_at = now() where id = $1",
    [id, next],
  );
  return true;
}

export async function deleteGalleryImage(id: string): Promise<boolean> {
  return deleteById("gallery_image", id);
}

export async function moveGalleryImage(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  await reorderRow("gallery_image", id, direction);
}

/** The media row a gallery entry points at, for the delete-file decision. */
export async function galleryImageMedia(id: string): Promise<MediaRow | null> {
  return queryOne<MediaRow>(
    `select m.id, m.filename, m.mime_type, m.byte_size, m.width, m.height, m.created_at
       from gallery_image g join media m on m.id = g.media_id
      where g.id = $1`,
    [id],
  );
}

// === Categories ===========================================================

export async function listGalleryCategories(): Promise<
  (GalleryCategoryRow & { image_count: number })[]
> {
  const rows = await query<GalleryCategoryRow & { image_count: string }>(
    `select c.id, c.slug, c.name, c.position,
            count(g.id)::text as image_count
       from gallery_category c
       left join gallery_image g on g.category_id = c.id
      group by c.id, c.slug, c.name, c.position
      order by c.position asc, c.slug asc`,
  );
  return rows.map((row) => ({ ...row, image_count: Number(row.image_count) }));
}

export async function createGalleryCategory(input: {
  slug: string;
  name: LocalisedValue;
}): Promise<string> {
  const position = await nextPosition("gallery_category");
  const row = await queryOne<{ id: string }>(
    `insert into gallery_category (slug, name, position)
     values ($1, $2::jsonb, $3) returning id`,
    [input.slug, json(input.name), position],
  );
  return row?.id ?? "";
}

export async function updateGalleryCategory(
  id: string,
  input: { slug: string; name: LocalisedValue },
): Promise<void> {
  await execute(
    `update gallery_category set slug = $2, name = $3::jsonb, updated_at = now()
      where id = $1`,
    [id, input.slug, json(input.name)],
  );
}

export async function deleteGalleryCategory(id: string): Promise<boolean> {
  /* Images keep their row and fall back to "no category", which the schema's
     `on delete set null` already arranges. */
  return deleteById("gallery_category", id);
}

export async function galleryCategorySlugAvailable(
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  return slugAvailable("gallery_category", slug, exceptId);
}
