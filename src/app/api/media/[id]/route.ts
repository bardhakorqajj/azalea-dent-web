import { getAdminSession } from "@/lib/admin/auth";
import { isDatabaseConfigured, queryOne } from "@/lib/db/client";
import { readMedia } from "@/lib/db/repos/media";
import { asUuid } from "@/lib/db/sql";

/**
 * Serves an uploaded image.
 *
 * This route is reachable from the public website — a service photo or a
 * gallery image has to load for a patient — so it cannot simply require a
 * session. Instead it asks whether the file is *published*: referenced by
 * something the public site actually shows. A file attached only to a draft,
 * or to a treatment photograph still awaiting patient consent, is served to
 * the signed-in admin and to nobody else.
 *
 * That check is the point of the route. Without it, an un-consented `work`
 * photograph would still be fetchable by anyone who guessed its id, and the
 * gallery's publishing rules would be protecting the page rather than the
 * file.
 */

export const runtime = "nodejs";

/** A year: the URL carries a uuid, so the bytes behind it never change. */
const PUBLIC_CACHE = "public, max-age=31536000, immutable";
const PRIVATE_CACHE = "private, no-store";

/**
 * Whether this file is on the public website.
 *
 * The publish flag on each referring row is checked, not merely the existence
 * of a reference — so unpublishing a gallery image stops serving its file too.
 */
async function isPubliclyVisible(id: string): Promise<boolean> {
  const row = await queryOne<{ visible: boolean }>(
    `select (
         exists (select 1 from service       where image_id = $1 and is_active = true)
      or exists (select 1 from treatment     where image_id = $1 and is_active = true)
      or exists (select 1 from promotion     where image_id = $1 and is_active = true)
      or exists (select 1 from team_member   where photo_id = $1 and is_active = true)
      or exists (select 1 from gallery_image where media_id = $1 and is_published = true)
      or exists (select 1 from setting
                  where key = 'logoMediaId' and value = to_jsonb($1::text))
     ) as visible`,
    [id],
  );
  return row?.visible ?? false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDatabaseConfigured()) return new Response(null, { status: 404 });

  const { id: raw } = await params;
  const id = asUuid(raw);
  /* Not a uuid: answer 404 rather than letting the database reject the cast. */
  if (!id) return new Response(null, { status: 404 });

  const publiclyVisible = await isPubliclyVisible(id);

  if (!publiclyVisible) {
    const session = await getAdminSession();
    /* 404, not 403: a private file should not confirm that it exists. */
    if (!session) return new Response(null, { status: 404 });
  }

  const media = await readMedia(id);
  if (!media) return new Response(null, { status: 404 });

  const etag = `"${media.checksum.slice(0, 32)}"`;
  const cacheControl = publiclyVisible ? PUBLIC_CACHE : PRIVATE_CACHE;

  /* A repeat visitor gets 304 and no bytes. Worth handling here because these
     rows are read out of the database rather than off a CDN's disk. */
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl },
    });
  }

  return new Response(new Uint8Array(media.data), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.data.byteLength),
      "Cache-Control": cacheControl,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      /* Belt and braces: even if a file somehow got past the format check, the
         browser must not execute it inside our origin. */
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
