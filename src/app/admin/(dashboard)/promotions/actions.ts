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
  isValidHref,
  isValidSlug,
  localised,
  slugify,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import { logActivity } from "@/lib/db/repos/activity";
import {
  createPromotion,
  deletePromotion,
  movePromotion,
  promotionSlugAvailable,
  togglePromotionActive,
  updatePromotion,
  type PromotionInput,
} from "@/lib/db/repos/promotions";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/** Promotion mutations. */

async function readForm(
  formData: FormData,
  exceptId?: string,
): Promise<{ ok: true; input: PromotionInput } | { ok: false; state: ActionState }> {
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const errors = new Errors();

  const title = localised(formData, "title", 300);
  const slugInput = str(formData, "slug", 80);
  const slug = slugInput === "" ? slugify(text(title, locale)) : slugInput;

  errors.requireLocalised("title", title, dict);

  if (slug === "") {
    errors.add("slug", dict.errors.required);
  } else if (!isValidSlug(slug)) {
    errors.add("slug", dict.errors.invalidSlug);
  } else if (!(await promotionSlugAvailable(slug, exceptId))) {
    errors.add("slug", dict.errors.slugTaken);
  }

  const ctaHref = str(formData, "ctaHref", 300);
  if (ctaHref !== "" && !isValidHref(ctaHref)) {
    errors.add("ctaHref", dict.errors.invalidUrl);
  }

  const startsOn = dateStr(formData, "startsOn");
  const endsOn = dateStr(formData, "endsOn");
  /* Checked here so the form can say which field is wrong; the schema's
     `promotion_dates_ordered` constraint refuses it either way. */
  if (startsOn && endsOn && endsOn < startsOn) {
    errors.add("endsOn", dict.promotions.datesInvalid);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      slug,
      title,
      description: localised(formData, "description", 4000),
      discountText: localised(formData, "discountText", 120),
      ctaLabel: localised(formData, "ctaLabel", 120),
      ctaHref: ctaHref === "" ? null : ctaHref,
      imageId: asUuid(formData.get("imageId")),
      startsOn,
      endsOn,
      isActive: bool(formData, "isActive"),
    },
  };
}

export async function createPromotionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createPromotion(parsed.input);
  refreshPublic(PUBLIC_TAGS.promotions);
  redirect(`/promotions/${id}?notice=saved`);
}

export async function updatePromotionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData, id);
  if (!parsed.ok) return parsed.state;

  await updatePromotion(id, parsed.input);
  refreshPublic(PUBLIC_TAGS.promotions);
  redirect(`/promotions/${id}?notice=saved`);
}

export async function togglePromotionActiveAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    const nowActive = await togglePromotionActive(id);
    if (nowActive) {
      await logActivity({
        kind: "promotion.activated",
        summary: str(formData, "label", 200) || id,
        entity: "promotion",
        entityId: id,
      });
    }
    refreshPublic(PUBLIC_TAGS.promotions);
  }
  redirect("/promotions?notice=saved");
}

export async function movePromotionAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await movePromotion(id, direction);
    refreshPublic(PUBLIC_TAGS.promotions);
  }
  redirect("/promotions");
}

export async function deletePromotionAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deletePromotion(id);
    refreshPublic(PUBLIC_TAGS.promotions);
  }
  redirect("/promotions?notice=deleted");
}
