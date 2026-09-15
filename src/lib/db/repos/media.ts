import { createHash } from "node:crypto";

import { probeImage, type AllowedImageType } from "@/lib/admin/image";
import { execute, query, queryOne } from "@/lib/db/client";
import type { MediaRow } from "@/lib/db/types";

/**
 * Uploaded files.
 *
 * The bytes live in the database rather than on disk. That is not the obvious
 * choice, but it is the right one here: this app is built to run on a
 * serverless host, where every request gets a fresh read-only filesystem — a
 * photograph written to `public/` would be gone on the next request, and would
 * not exist at all for the other instances serving the site. Object storage
 * would work too, but it is another account to hold, another set of
 * credentials, and another thing that can be misconfigured to public-read; the
 * clinic's gallery is tens of photographs, which a Postgres table holds
 * without complaint.
 *
 * They are served by `/api/media/[id]`, which is what Next's image optimiser
 * then resizes — so the row stays the original and the website still gets AVIF
 * at the size each layout asks for.
 */

/** Columns for a listing: never the bytes, which would be megabytes per row. */
const SELECT_META = `
  id, filename, mime_type, byte_size, width, height, created_at
`;

export type MediaUploadResult =
  | { ok: true; id: string; reused: boolean }
  | { ok: false; reason: "too_large" | "wrong_type" | "empty" };

/**
 * Stores an uploaded image after checking what it actually is.
 *
 * Re-uploading the same file returns the existing row rather than a second
 * copy: the checksum is unique, so a gallery entry and a service image can
 * share one set of bytes.
 */
export async function storeMedia(input: {
  filename: string;
  bytes: Uint8Array;
  maxBytes: number;
}): Promise<MediaUploadResult> {
  if (input.bytes.byteLength === 0) return { ok: false, reason: "empty" };
  if (input.bytes.byteLength > input.maxBytes) return { ok: false, reason: "too_large" };

  /* The format is decided by the bytes, never by the browser's Content-Type or
     the filename — both of which the uploader controls. */
  const probe = probeImage(input.bytes);
  if (!probe) return { ok: false, reason: "wrong_type" };

  const buffer = Buffer.from(input.bytes);
  const checksum = createHash("sha256").update(buffer).digest("hex");

  const existing = await queryOne<{ id: string }>(
    "select id from media where checksum = $1",
    [checksum],
  );
  if (existing) return { ok: true, id: existing.id, reused: true };

  const row = await queryOne<{ id: string }>(
    `insert into media (filename, mime_type, byte_size, width, height, checksum, data)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      safeFilename(input.filename, probe.mimeType),
      probe.mimeType,
      buffer.byteLength,
      probe.width,
      probe.height,
      checksum,
      buffer,
    ],
  );

  return { ok: true, id: row?.id ?? "", reused: false };
}

/** The bytes, for the route that serves them. */
export async function readMedia(
  id: string,
): Promise<{ data: Buffer; mimeType: string; checksum: string } | null> {
  const row = await queryOne<{ data: Buffer; mime_type: string; checksum: string }>(
    "select data, mime_type, checksum from media where id = $1",
    [id],
  );
  if (!row) return null;
  return { data: row.data, mimeType: row.mime_type, checksum: row.checksum };
}

export async function getMediaMeta(id: string): Promise<MediaRow | null> {
  return queryOne<MediaRow>(`select ${SELECT_META} from media where id = $1`, [id]);
}

export async function listMedia(limit = 60): Promise<MediaRow[]> {
  return query<MediaRow>(
    `select ${SELECT_META} from media order by created_at desc limit $1`,
    [limit],
  );
}

/**
 * Deletes a file only if nothing points at it any more.
 *
 * Checked here rather than left to the foreign keys, because most of them are
 * `on delete set null` — dropping the row would silently blank a service's
 * image instead of refusing.
 */
export async function deleteMediaIfUnused(id: string): Promise<boolean> {
  const row = await queryOne<{ uses: string }>(
    `select (
         (select count(*) from service       where image_id = $1)
       + (select count(*) from treatment     where image_id = $1)
       + (select count(*) from promotion     where image_id = $1)
       + (select count(*) from team_member   where photo_id = $1)
       + (select count(*) from social_post   where media_id = $1)
       + (select count(*) from gallery_image where media_id = $1)
     )::text as uses`,
    [id],
  );

  if (Number(row?.uses ?? 0) > 0) return false;

  await execute("delete from media where id = $1", [id]);
  return true;
}

export async function mediaCount(): Promise<number> {
  const row = await queryOne<{ count: string }>("select count(*)::text as count from media");
  return Number(row?.count ?? 0);
}

/** How much of the database the uploads take up, shown in Settings. */
export async function mediaTotalBytes(): Promise<number> {
  const row = await queryOne<{ total: string }>(
    "select coalesce(sum(byte_size), 0)::text as total from media",
  );
  return Number(row?.total ?? 0);
}

const EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * A filename safe to echo back in a `Content-Disposition` header and to show
 * in the dashboard.
 *
 * Directory separators, control bytes and the characters that give header
 * parsers and filesystems trouble are stripped, and the extension is set from
 * the format actually detected rather than from whatever the file was called —
 * so a PNG uploaded as `photo.png.jpg` is stored as `photo.png.png`, never as
 * something whose name lies about its type.
 */
export function safeFilename(raw: string, mimeType: AllowedImageType): string {
  const base = (raw.split(/[\\/]/).pop() ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["'<>|?*:;,]/g, "")
    .replace(/\.[^.]*$/, "")
    .trim()
    .slice(0, 80);

  const stem = base === "" ? "upload" : base;
  return `${stem}.${EXTENSIONS[mimeType]}`;
}
