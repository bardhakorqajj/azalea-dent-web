"use client";

import { useRef, useState } from "react";

import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/admin/image";
import { cn } from "@/lib/utils";

import { IconClose, IconUpload } from "./Icons";
import { buttonClass } from "./Ui";

/**
 * Picks an image for a service, a team member, a promotion or a post.
 *
 * The file is uploaded as soon as it is chosen and the returned id goes into a
 * hidden input, so the surrounding form saves an id rather than a file — which
 * keeps the form a plain server action and lets the admin see the photograph
 * before committing to it.
 *
 * A plain `<img>` rather than `next/image`: the source is chosen in the
 * browser after the page has rendered, so there is no width or height to give
 * the optimiser at build time, and this preview is a few hundred pixels in the
 * dashboard rather than anything a patient loads.
 */
export function ImagePicker({
  name,
  label,
  csrfToken,
  currentId,
  hint,
  labels,
}: {
  /** The hidden input's name, e.g. `imageId`. */
  name: string;
  label: string;
  csrfToken: string;
  currentId?: string | null;
  hint?: string;
  labels: {
    upload: string;
    uploading: string;
    remove: string;
    tooLarge: string;
    wrongType: string;
    failed: string;
  };
}) {
  const [mediaId, setMediaId] = useState<string | null>(currentId ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const sizeLimit = formatBytes(MAX_UPLOAD_BYTES);

  async function upload(file: File): Promise<void> {
    setError(null);

    /* Checked here too, so an obviously oversized file is refused without
       spending the upload. The server checks the bytes regardless. */
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(labels.tooLarge.replace("{size}", sizeLimit));
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("csrf", csrfToken);

      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = (await response.json()) as
        | { ok: true; id: string }
        | { ok: false; error: string };

      if (!result.ok) {
        setError(
          result.error === "too_large"
            ? labels.tooLarge.replace("{size}", sizeLimit)
            : result.error === "wrong_type"
              ? labels.wrongType
              : labels.failed,
        );
        return;
      }

      setMediaId(result.id);
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
      /* Cleared so choosing the same file again still fires a change event. */
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="admin-label mb-1.5 block">{label}</span>

      <input type="hidden" name={name} value={mediaId ?? ""} />

      <div className="flex flex-wrap items-start gap-4">
        {mediaId ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- the source is chosen in the browser, so there is no build-time size for the optimiser */}
            <img
              src={`/api/media/${mediaId}`}
              alt=""
              className="h-24 w-32 rounded-sm border border-ink-900/12 object-cover dark:border-bone-100/12"
            />
            <button
              type="button"
              onClick={() => setMediaId(null)}
              aria-label={labels.remove}
              className="absolute -top-2 -right-2 rounded-full bg-ink-900 p-1 text-bone-50 shadow-sm transition-colors hover:bg-ink-700 dark:bg-bone-100 dark:text-ink-950"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-24 w-32 items-center justify-center rounded-sm border border-dashed border-ink-900/20 text-ink-300 dark:border-bone-100/20 dark:text-ink-500">
            <IconUpload />
          </div>
        )}

        <div className="min-w-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={buttonClass("secondary", "sm")}
          >
            <IconUpload className="h-4 w-4" />
            {busy ? labels.uploading : labels.upload}
          </button>

          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />

          {hint && !error && (
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
              {hint.replace("{size}", sizeLimit)}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className={cn(
                "mt-2 text-[0.8125rem] font-medium",
                "text-[#96371f] dark:text-[#e8a08d]",
              )}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
