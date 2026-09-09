"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import {
  bool,
  Errors,
  errorState,
  isValidSlug,
  localised,
  positiveInt,
  slugify,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import {
  createTreatment,
  deleteTreatment,
  moveTreatment,
  treatmentSlugAvailable,
  updateTreatment,
  type TreatmentInput,
} from "@/lib/db/repos/treatments";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/** Treatment mutations — the procedures that sit under a service. */

async function readForm(
  formData: FormData,
  exceptId?: string,
): Promise<{ ok: true; input: TreatmentInput } | { ok: false; state: ActionState }> {
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
  } else if (!(await treatmentSlugAvailable(slug, exceptId))) {
    errors.add("slug", dict.errors.slugTaken);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      slug,
      serviceId: asUuid(formData.get("serviceId")),
      title,
      summary: localised(formData, "summary", 600),
      body: localised(formData, "body", 20_000),
      priceText: localised(formData, "priceText", 120),
      durationMinutes: positiveInt(formData, "durationMinutes"),
      imageId: asUuid(formData.get("imageId")),
      isActive: bool(formData, "isActive"),
      isFeatured: bool(formData, "isFeatured"),
    },
  };
}

export async function createTreatmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createTreatment(parsed.input);
  refreshPublic(PUBLIC_TAGS.treatments);
  redirect(`/treatments/${id}?notice=saved`);
}

export async function updateTreatmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData, id);
  if (!parsed.ok) return parsed.state;

  await updateTreatment(id, parsed.input);
  refreshPublic(PUBLIC_TAGS.treatments);
  redirect(`/treatments/${id}?notice=saved`);
}

export async function moveTreatmentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveTreatment(id, direction);
    refreshPublic(PUBLIC_TAGS.treatments);
  }
  redirect("/treatments");
}

export async function deleteTreatmentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteTreatment(id);
    refreshPublic(PUBLIC_TAGS.treatments);
  }
  redirect("/treatments?notice=deleted");
}
