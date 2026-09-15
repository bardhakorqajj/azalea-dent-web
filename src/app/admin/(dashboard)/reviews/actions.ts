"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  bool,
  dateStr,
  Errors,
  errorState,
  int,
  isValidHref,
  localised,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import { logActivity } from "@/lib/db/repos/activity";
import {
  createReview,
  deleteReview,
  moveReview,
  toggleReviewPublished,
  updateReview,
  type ReviewInput,
} from "@/lib/db/repos/reviews";
import { asUuid } from "@/lib/db/sql";
import { oneOf, REVIEW_SOURCES } from "@/lib/db/types";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/**
 * Review mutations.
 *
 * `source` is never inferred: the admin says whether a review was typed in by
 * hand or came from a platform, and the repository stamps `imported_at` only
 * for the latter. Nothing in this file, or anywhere else, creates a review the
 * clinic did not enter.
 */

async function readForm(
  formData: FormData,
): Promise<{ ok: true; input: ReviewInput } | { ok: false; state: ActionState }> {
  const dict = getAdminDictionary(await getAdminLocale());
  const errors = new Errors();

  const authorName = str(formData, "authorName", 160);
  const body = localised(formData, "body", 4000);

  errors.require("authorName", authorName, dict);
  errors.requireLocalised("body", body, dict);

  const rating = int(formData, "rating");
  if (rating !== null && (rating < 1 || rating > 5)) {
    errors.add("rating", dict.errors.required);
  }

  const externalUrl = str(formData, "externalUrl", 500);
  if (externalUrl !== "" && !isValidHref(externalUrl)) {
    errors.add("externalUrl", dict.errors.invalidUrl);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      authorName,
      body,
      rating,
      source: oneOf(REVIEW_SOURCES, str(formData, "source", 20)) ?? "manual",
      externalUrl: externalUrl === "" ? null : externalUrl,
      reviewedOn: dateStr(formData, "reviewedOn"),
      isPublished: bool(formData, "isPublished"),
      isFeatured: bool(formData, "isFeatured"),
    },
  };
}

export async function createReviewAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createReview(parsed.input);
  refreshPublic(PUBLIC_TAGS.reviews);
  redirect(`/reviews/${id}?notice=saved`);
}

export async function updateReviewAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  await updateReview(id, parsed.input);
  refreshPublic(PUBLIC_TAGS.reviews);
  redirect(`/reviews/${id}?notice=saved`);
}

export async function toggleReviewPublishedAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    const published = await toggleReviewPublished(id);
    if (published) {
      await logActivity({
        kind: "review.published",
        summary: str(formData, "label", 200) || id,
        entity: "review",
        entityId: id,
      });
    }
    refreshPublic(PUBLIC_TAGS.reviews);
  }
  redirect("/reviews?notice=saved");
}

export async function moveReviewAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveReview(id, direction);
    refreshPublic(PUBLIC_TAGS.reviews);
  }
  redirect("/reviews");
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteReview(id);
    refreshPublic(PUBLIC_TAGS.reviews);
  }
  redirect("/reviews?notice=deleted");
}
