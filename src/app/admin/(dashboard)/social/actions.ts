"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  Errors,
  errorState,
  isValidHref,
  optionalStr,
  str,
  textBlock,
  type ActionState,
} from "@/lib/admin/forms";
import { logActivity } from "@/lib/db/repos/activity";
import {
  createSocialPost,
  deleteSocialPost,
  parseHashtags,
  setSocialStatus,
  updateSocialPost,
  type SocialPostInput,
} from "@/lib/db/repos/social";
import { asUuid } from "@/lib/db/sql";
import { oneOf, SOCIAL_PLATFORMS, SOCIAL_STATUSES } from "@/lib/db/types";

/**
 * Social post mutations.
 *
 * Nothing here publishes anything. Moving a post to `published` records that
 * the clinic posted it; there is no API call, because posting on the clinic's
 * behalf needs an authorised Meta app that does not exist yet, and a button
 * that pretends to publish would be worse than no button. When that
 * integration is built, it calls `setSocialStatus` from a job — the workflow
 * and the statuses are already the right shape for it.
 *
 * No social credentials are read, written or stored by any of this.
 */

async function readForm(
  formData: FormData,
): Promise<{ ok: true; input: SocialPostInput } | { ok: false; state: ActionState }> {
  const dict = getAdminDictionary(await getAdminLocale());
  const errors = new Errors();

  const caption = textBlock(formData, "caption", 4000);
  errors.require("caption", caption, dict);

  const externalUrl = str(formData, "externalUrl", 500);
  if (externalUrl !== "" && !isValidHref(externalUrl)) {
    errors.add("externalUrl", dict.errors.invalidUrl);
  }

  /* A `datetime-local` value has no timezone, so it is read as the server's
     local time — which is the clinic's, and the only reading that makes sense
     for "post this on Tuesday at nine". */
  const scheduledRaw = str(formData, "scheduledFor", 20);
  let scheduledFor: Date | null = null;
  if (scheduledRaw !== "") {
    const parsed = new Date(scheduledRaw);
    if (Number.isNaN(parsed.getTime())) {
      errors.add("scheduledFor", dict.errors.invalidDate);
    } else {
      scheduledFor = parsed;
    }
  }

  const status = oneOf(SOCIAL_STATUSES, str(formData, "status", 30)) ?? "draft";

  /* "Scheduled" without a date is a status that cannot mean anything. */
  if (status === "scheduled" && !scheduledFor) {
    errors.add("scheduledFor", dict.errors.required);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      platform: oneOf(SOCIAL_PLATFORMS, str(formData, "platform", 20)) ?? "instagram",
      headline: optionalStr(formData, "headline", 200),
      caption,
      hashtags: parseHashtags(str(formData, "hashtags", 1000)),
      mediaId: asUuid(formData.get("mediaId")),
      mediaSuggestion: textBlock(formData, "mediaSuggestion", 1000) || null,
      language: str(formData, "language", 5) === "en" ? "en" : "sq",
      status,
      scheduledFor,
      externalUrl: externalUrl === "" ? null : externalUrl,
      notes: textBlock(formData, "notes", 2000) || null,
    },
  };
}

export async function createSocialPostAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createSocialPost(parsed.input);
  revalidatePath("/admin", "layout");
  redirect(`/social/${id}?notice=saved`);
}

export async function updateSocialPostAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  await updateSocialPost(id, parsed.input);
  revalidatePath("/admin", "layout");
  redirect(`/social/${id}?notice=saved`);
}

/** The workflow buttons: send for approval, approve, mark as published. */
export async function setSocialStatusAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const status = oneOf(SOCIAL_STATUSES, formData.get("status"));
  if (!id || !status) redirect("/social");

  await setSocialStatus(id, status);

  if (status === "approved") {
    await logActivity({
      kind: "social.approved",
      summary: str(formData, "label", 200) || id,
      entity: "social_post",
      entityId: id,
    });
  }

  revalidatePath("/admin", "layout");
  redirect(`/social/${id}?notice=saved`);
}

export async function deleteSocialPostAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteSocialPost(id);
    revalidatePath("/admin", "layout");
  }
  redirect("/social?notice=deleted");
}
