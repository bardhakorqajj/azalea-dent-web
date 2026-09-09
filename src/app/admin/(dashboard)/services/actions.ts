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
  localisedList,
  positiveInt,
  slugify,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import {
  createService,
  deleteService,
  moveService,
  serviceSlugAvailable,
  toggleServiceActive,
  updateService,
  type ServiceInput,
} from "@/lib/db/repos/services";
import { importSiteContent } from "@/lib/admin/import-site-content";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/**
 * Service mutations.
 *
 * Each one ends by invalidating the public site's cached read of this table.
 * That call is what makes an edit here appear on azaleadent.org straight away
 * rather than whenever a cache happens to expire.
 */

function refreshPublicSite(): void {
  refreshPublic(PUBLIC_TAGS.services);
}

async function readForm(
  formData: FormData,
  exceptId?: string,
): Promise<{ ok: true; input: ServiceInput } | { ok: false; state: ActionState }> {
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const errors = new Errors();

  const title = localised(formData, "title", 300);
  /* A courtesy: an empty slug is derived from the title rather than making the
     admin transliterate "përgjithshme" by hand. */
  const slugInput = str(formData, "slug", 80);
  const slug = slugInput === "" ? slugify(text(title, locale)) : slugInput;

  errors.requireLocalised("title", title, dict);

  if (slug === "") {
    errors.add("slug", dict.errors.required);
  } else if (!isValidSlug(slug)) {
    errors.add("slug", dict.errors.invalidSlug);
  } else if (!(await serviceSlugAvailable(slug, exceptId))) {
    errors.add("slug", dict.errors.slugTaken);
  }

  if (errors.any) {
    return { ok: false, state: errorState(dict.errors.body, errors.all) };
  }

  return {
    ok: true,
    input: {
      slug,
      title,
      summary: localised(formData, "summary", 600),
      body: localised(formData, "body", 20_000),
      highlights: localisedList(formData, "highlights"),
      priceText: localised(formData, "priceText", 120),
      durationMinutes: positiveInt(formData, "durationMinutes"),
      imageId: asUuid(formData.get("imageId")),
      seoTitle: localised(formData, "seoTitle", 200),
      seoDescription: localised(formData, "seoDescription", 400),
      isActive: bool(formData, "isActive"),
      isFeatured: bool(formData, "isFeatured"),
    },
  };
}

export async function createServiceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const parsed = await readForm(formData);
  if (!parsed.ok) return parsed.state;

  const id = await createService(parsed.input);
  refreshPublicSite();
  redirect(`/services/${id}?notice=saved`);
}

export async function updateServiceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) return errorState(getAdminDictionary(await getAdminLocale()).errors.notFound);

  const parsed = await readForm(formData, id);
  if (!parsed.ok) return parsed.state;

  await updateService(id, parsed.input);
  refreshPublicSite();
  redirect(`/services/${id}?notice=saved`);
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await toggleServiceActive(id);
    refreshPublicSite();
  }
  redirect("/services?notice=saved");
}

export async function moveServiceAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveService(id, direction);
    refreshPublicSite();
  }
  redirect("/services");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteService(id);
    refreshPublicSite();
  }
  redirect("/services?notice=deleted");
}

/**
 * Fills the database with the content the website already publishes.
 *
 * Additive and idempotent — see `importSiteContent`. Every table it touches is
 * invalidated afterwards, because the public site switches from the shipped
 * content to the database rows the moment they exist.
 */
export async function importSiteContentAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const result = await importSiteContent();

  refreshPublic(
    PUBLIC_TAGS.services,
    PUBLIC_TAGS.team,
    PUBLIC_TAGS.faq,
    PUBLIC_TAGS.content,
  );

  redirect(
    result.total > 0
      ? `/services?notice=imported&count=${result.total}`
      : "/services?notice=saved",
  );
}
