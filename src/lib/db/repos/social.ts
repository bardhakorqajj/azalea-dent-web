import { execute, query, queryOne } from "@/lib/db/client";
import { deleteById, json, likeTerm } from "@/lib/db/sql";
import {
  toPage,
  type Page,
  type SocialPlatform,
  type SocialPostRow,
  type SocialStatus,
} from "@/lib/db/types";

/**
 * Social media posts.
 *
 * This is a preparation and approval workflow, not a publisher. Nothing in
 * this file talks to Instagram or Facebook, and nothing pretends to: posting
 * on the clinic's behalf needs an authorised Meta app that does not exist yet.
 *
 * `published_at` is therefore only ever set by the admin recording that a post
 * went out, or later by a real integration — which is why `external_url` is a
 * plain column rather than something derived. No credentials for any social
 * platform are stored anywhere in this schema.
 *
 * The intended rhythm is about two posts a week, mostly in Albanian; that is a
 * matter of how the clinic uses the calendar, so nothing here enforces it.
 */

const PER_PAGE = 20;

const SELECT = `
  id, platform, headline, caption, hashtags, media_id::text as media_id,
  media_suggestion, language, status, scheduled_for, approved_at, published_at,
  external_url, failure_reason, notes, created_at, updated_at
`;

/** The order the workflow runs in, so a list reads top to bottom. */
const STATUS_ORDER = `
  case status
    when 'failed' then 0
    when 'ready_for_approval' then 1
    when 'approved' then 2
    when 'scheduled' then 3
    when 'draft' then 4
    when 'published' then 5
    else 6
  end
`;

export async function listSocialPosts(filters: {
  search?: string;
  status?: SocialStatus | "all";
  platform?: SocialPlatform | "all";
  page?: number;
} = {}): Promise<Page<SocialPostRow>> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search && filters.search.trim() !== "") {
    params.push(likeTerm(filters.search.trim()));
    const p = `$${params.length}`;
    conditions.push(
      `(headline ilike ${p} escape '\\' or caption ilike ${p} escape '\\'
        or hashtags::text ilike ${p} escape '\\')`,
    );
  }

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.platform && filters.platform !== "all") {
    params.push(filters.platform);
    conditions.push(`platform = $${params.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

  const totalRow = await queryOne<{ count: string }>(
    `select count(*)::text as count from social_post ${where}`,
    params,
  );
  const total = Number(totalRow?.count ?? 0);
  const page = Math.max(1, filters.page ?? 1);

  const rows = await query<SocialPostRow>(
    `select ${SELECT} from social_post ${where}
      order by ${STATUS_ORDER}, coalesce(scheduled_for, created_at) desc
      limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    params,
  );

  return toPage(rows, total, page, PER_PAGE);
}

export async function getSocialPost(id: string): Promise<SocialPostRow | null> {
  return queryOne<SocialPostRow>(`select ${SELECT} from social_post where id = $1`, [id]);
}

/** Everything with a date in a window — the content calendar's one query. */
export async function socialPostsBetween(
  from: Date,
  to: Date,
): Promise<SocialPostRow[]> {
  return query<SocialPostRow>(
    `select ${SELECT} from social_post
      where coalesce(published_at, scheduled_for) >= $1
        and coalesce(published_at, scheduled_for) < $2
      order by coalesce(published_at, scheduled_for) asc`,
    [from, to],
  );
}

export async function socialCounts(): Promise<{
  forApproval: number;
  scheduled: number;
  published: number;
  byStatus: Record<SocialStatus, number>;
}> {
  const rows = await query<{ status: SocialStatus; count: string }>(
    "select status, count(*)::text as count from social_post group by status",
  );

  const byStatus: Record<SocialStatus, number> = {
    draft: 0,
    ready_for_approval: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
  };
  for (const row of rows) byStatus[row.status] = Number(row.count);

  return {
    forApproval: byStatus.ready_for_approval,
    scheduled: byStatus.scheduled,
    published: byStatus.published,
    byStatus,
  };
}

export async function postsForApprovalCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from social_post where status = 'ready_for_approval'",
  );
  return Number(row?.count ?? 0);
}

export type SocialPostInput = {
  platform: SocialPlatform;
  headline: string | null;
  caption: string;
  hashtags: string[];
  mediaId: string | null;
  mediaSuggestion: string | null;
  language: string;
  status: SocialStatus;
  scheduledFor: Date | null;
  externalUrl: string | null;
  notes: string | null;
};

export async function createSocialPost(input: SocialPostInput): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `insert into social_post (
       platform, headline, caption, hashtags, media_id, media_suggestion,
       language, status, scheduled_for, external_url, notes,
       approved_at, published_at
     ) values (
       $1, $2, $3, $4::jsonb, $5::uuid, $6, $7, $8, $9, $10, $11,
       case when $8 in ('approved', 'scheduled', 'published') then now() end,
       case when $8 = 'published' then now() end
     ) returning id`,
    [
      input.platform,
      input.headline,
      input.caption,
      json(input.hashtags),
      input.mediaId,
      input.mediaSuggestion,
      input.language,
      input.status,
      input.scheduledFor,
      input.externalUrl,
      input.notes,
    ],
  );
  return row?.id ?? "";
}

export async function updateSocialPost(id: string, input: SocialPostInput): Promise<void> {
  await execute(
    `update social_post set
       platform = $2, headline = $3, caption = $4, hashtags = $5::jsonb,
       media_id = $6::uuid, media_suggestion = $7, language = $8, status = $9,
       scheduled_for = $10, external_url = $11, notes = $12,
       /* Stamped the first time it reaches each state and then left alone, so
          editing an approved post does not restamp it as approved today. */
       approved_at = case
         when $9 in ('approved', 'scheduled', 'published')
           then coalesce(approved_at, now())
         else null
       end,
       published_at = case
         when $9 = 'published' then coalesce(published_at, now())
         else null
       end,
       failure_reason = case when $9 = 'failed' then failure_reason else null end,
       updated_at = now()
     where id = $1`,
    [
      id,
      input.platform,
      input.headline,
      input.caption,
      json(input.hashtags),
      input.mediaId,
      input.mediaSuggestion,
      input.language,
      input.status,
      input.scheduledFor,
      input.externalUrl,
      input.notes,
    ],
  );
}

/** Moves a post along the workflow without touching the rest of the row. */
export async function setSocialStatus(
  id: string,
  status: SocialStatus,
): Promise<void> {
  await execute(
    `update social_post set
       status = $2,
       approved_at = case
         when $2 in ('approved', 'scheduled', 'published') then coalesce(approved_at, now())
         else null
       end,
       published_at = case
         when $2 = 'published' then coalesce(published_at, now())
         else null
       end,
       updated_at = now()
     where id = $1`,
    [id, status],
  );
}

export async function deleteSocialPost(id: string): Promise<boolean> {
  return deleteById("social_post", id);
}

/** Normalises whatever the admin typed into a clean list of hashtags. */
export function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter((tag) => tag !== "")
    /* Keeps letters (Albanian included), digits and underscores, which is
       what the platforms actually accept in a tag. */
    .map((tag) => tag.replace(/[^\p{L}\p{N}_]/gu, ""))
    .filter((tag) => tag !== "")
    .slice(0, 30)
    .map((tag) => `#${tag}`);
}
