import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, nextPosition, reorderRow } from "@/lib/db/sql";
import type { LocalisedValue, ReviewRow, ReviewSource } from "@/lib/db/types";

/**
 * Patient reviews.
 *
 * `source` is the honest part of this table. A review the clinic typed in is
 * `'manual'`; anything else came from that platform through an import and
 * carries `imported_at` and usually an `external_url`. The dashboard shows
 * that distinction on every row, so a hand-entered testimonial is never
 * mistaken for a verified Google review — and nothing in this codebase invents
 * a review.
 */

const SELECT = `
  id, author_name, body, rating, source, external_id, external_url,
  to_char(reviewed_on, 'YYYY-MM-DD') as reviewed_on,
  imported_at, is_published, is_featured, position, created_at, updated_at
`;

export async function listReviews(filters: {
  source?: ReviewSource | "all";
  publishedOnly?: boolean;
} = {}): Promise<ReviewRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.source && filters.source !== "all") {
    params.push(filters.source);
    conditions.push(`source = $${params.length}`);
  }
  if (filters.publishedOnly) conditions.push("is_published = true");

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  return query<ReviewRow>(
    `select ${SELECT} from review ${where}
      order by position asc, coalesce(reviewed_on, created_at::date) desc`,
    params,
  );
}

/** What the public website's testimonials section reads. */
export async function publishedReviews(): Promise<ReviewRow[]> {
  return query<ReviewRow>(
    `select ${SELECT} from review where is_published = true
      order by is_featured desc, position asc, coalesce(reviewed_on, created_at::date) desc`,
  );
}

export async function getReview(id: string): Promise<ReviewRow | null> {
  return queryOne<ReviewRow>(`select ${SELECT} from review where id = $1`, [id]);
}

export async function recentReviews(limit = 4): Promise<ReviewRow[]> {
  return query<ReviewRow>(
    `select ${SELECT} from review order by created_at desc limit $1`,
    [limit],
  );
}

export async function reviewStats(): Promise<{
  total: number;
  published: number;
  averageRating: number | null;
}> {
  const row = await queryOne<{ total: string; published: string; average: string | null }>(
    `select count(*)::text as total,
            count(*) filter (where is_published = true)::text as published,
            round(avg(rating)::numeric, 1)::text as average
       from review`,
  );
  return {
    total: Number(row?.total ?? 0),
    published: Number(row?.published ?? 0),
    averageRating: row?.average ? Number(row.average) : null,
  };
}

export type ReviewInput = {
  authorName: string;
  body: LocalisedValue;
  rating: number | null;
  source: ReviewSource;
  externalUrl: string | null;
  reviewedOn: string | null;
  isPublished: boolean;
  isFeatured: boolean;
};

export async function createReview(input: ReviewInput): Promise<string> {
  const position = await nextPosition("review");

  const row = await queryOne<{ id: string }>(
    `insert into review (
       author_name, body, rating, source, external_url, reviewed_on,
       is_published, is_featured, position, imported_at
     ) values (
       $1, $2::jsonb, $3, $4, $5, $6::date, $7, $8, $9,
       /* Only a review that came from a platform is stamped as imported. */
       case when $4 <> 'manual' then now() end
     ) returning id`,
    [
      input.authorName,
      json(input.body),
      input.rating,
      input.source,
      input.externalUrl,
      input.reviewedOn,
      input.isPublished,
      input.isFeatured,
      position,
    ],
  );
  return row?.id ?? "";
}

export async function updateReview(id: string, input: ReviewInput): Promise<void> {
  await execute(
    `update review set
       author_name = $2, body = $3::jsonb, rating = $4, source = $5,
       external_url = $6, reviewed_on = $7::date, is_published = $8,
       is_featured = $9, updated_at = now()
     where id = $1`,
    [
      id,
      input.authorName,
      json(input.body),
      input.rating,
      input.source,
      input.externalUrl,
      input.reviewedOn,
      input.isPublished,
      input.isFeatured,
    ],
  );
}

export async function toggleReviewPublished(id: string): Promise<boolean> {
  const row = await queryOne<{ is_published: boolean }>(
    `update review set is_published = not is_published, updated_at = now()
      where id = $1 returning is_published`,
    [id],
  );
  return row?.is_published ?? false;
}

export async function deleteReview(id: string): Promise<boolean> {
  return deleteById("review", id);
}

export async function moveReview(id: string, direction: "up" | "down"): Promise<void> {
  await reorderRow("review", id, direction);
}

/**
 * Upserts a review that arrived from a platform.
 *
 * Written now so that adding a Google or Facebook import later is a matter of
 * calling this with the platform's payload: the unique index on
 * (source, external_id) means re-running an import updates rather than
 * duplicating. Nothing calls it yet — there is no authorised integration.
 */
export async function upsertImportedReview(input: {
  source: Exclude<ReviewSource, "manual">;
  externalId: string;
  authorName: string;
  body: LocalisedValue;
  rating: number | null;
  externalUrl: string | null;
  reviewedOn: string | null;
}): Promise<void> {
  await execute(
    `insert into review (
       author_name, body, rating, source, external_id, external_url,
       reviewed_on, imported_at
     ) values ($1, $2::jsonb, $3, $4, $5, $6, $7::date, now())
     on conflict (source, external_id) where external_id is not null
     do update set
       author_name = excluded.author_name,
       body = excluded.body,
       rating = excluded.rating,
       external_url = excluded.external_url,
       reviewed_on = excluded.reviewed_on,
       imported_at = now(),
       updated_at = now()`,
    [
      input.authorName,
      json(input.body),
      input.rating,
      input.source,
      input.externalId,
      input.externalUrl,
      input.reviewedOn,
    ],
  );
}
