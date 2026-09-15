import { probeImage, MAX_UPLOAD_BYTES } from "@/lib/admin/image";
import { requireAdminForAction, verifySameOrigin } from "@/lib/admin/auth";
import { verifyCsrfToken } from "@/lib/admin/session";
import { storeMedia } from "@/lib/db/repos/media";

/**
 * Receives an uploaded image.
 *
 * A route handler rather than a server action because the browser sends the
 * file with `fetch` while the surrounding form is still being filled in — the
 * admin picks a photo, sees it appear, and only then saves the service.
 *
 * Being a route handler means none of a server action's protections apply
 * automatically, so all three are done by hand: the session, the origin, and
 * the CSRF token. The file itself is then checked by its bytes rather than by
 * anything the browser said about it.
 */

export const runtime = "nodejs";

type UploadResponse =
  | { ok: true; id: string; url: string; width: number | null; height: number | null }
  | { ok: false; error: "unauthorized" | "too_large" | "wrong_type" | "empty" | "no_file" };

function json(body: UploadResponse, status: number): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  await requireAdminForAction();

  if (!(await verifySameOrigin())) {
    return json({ ok: false, error: "unauthorized" }, 403);
  }

  /* Refuse an oversized body before reading it into memory. The check is
     repeated on the actual bytes below, because Content-Length is a claim. */
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES * 1.1) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "no_file" }, 400);
  }

  if (!(await verifyCsrfToken(form.get("csrf")))) {
    return json({ ok: false, error: "unauthorized" }, 403);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return json({ ok: false, error: "no_file" }, 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  /* Checked here as well as in `storeMedia`, so the response can name the
     problem before a row is attempted. */
  if (!probeImage(bytes)) {
    return json({ ok: false, error: "wrong_type" }, 415);
  }

  const stored = await storeMedia({
    filename: file.name,
    bytes,
    maxBytes: MAX_UPLOAD_BYTES,
  });

  if (!stored.ok) {
    return json({ ok: false, error: stored.reason }, 400);
  }

  const probe = probeImage(bytes);

  return json(
    {
      ok: true,
      id: stored.id,
      url: `/api/media/${stored.id}`,
      width: probe?.width ?? null,
      height: probe?.height ?? null,
    },
    201,
  );
}
