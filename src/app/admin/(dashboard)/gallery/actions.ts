"use server";

import { redirect } from "next/navigation";

import { getAdminDictionary } from "@/admin/get-dictionary";
import { getAdminLocale } from "@/admin/locale";
import { requireAdminMutation } from "@/lib/admin/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/admin/image";
import {
  bool,
  Errors,
  errorState,
  isValidSlug,
  localised,
  slugify,
  str,
  type ActionState,
} from "@/lib/admin/forms";
import {
  createGalleryCategory,
  createGalleryImage,
  deleteGalleryCategory,
  deleteGalleryImage,
  galleryCategorySlugAvailable,
  galleryConsentSatisfied,
  galleryImageMedia,
  moveGalleryImage,
  toggleGalleryPublished,
  updateGalleryImage,
  type GalleryImageInput,
} from "@/lib/db/repos/gallery";
import { deleteMediaIfUnused, storeMedia } from "@/lib/db/repos/media";
import { asUuid } from "@/lib/db/sql";
import { GALLERY_KINDS, oneOf, text } from "@/lib/db/types";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/**
 * Gallery mutations.
 *
 * The consent rule is enforced in three places, on purpose: the form disables
 * the combination, these actions refuse it, and a check constraint in the
 * schema rejects the row. A treatment photograph reaching the public website
 * without recorded consent would be a real harm to a real patient, so it is
 * not left to one layer of validation.
 */

function readImageForm(formData: FormData): GalleryImageInput {
  return {
    categoryId: asUuid(formData.get("categoryId")),
    alt: localised(formData, "alt", 400),
    caption: localised(formData, "caption", 400),
    kind: oneOf(GALLERY_KINDS, str(formData, "kind", 20)) ?? "clinic",
    consentOnFile: bool(formData, "consentOnFile"),
    isPublished: bool(formData, "isPublished"),
    isFeatured: bool(formData, "isFeatured"),
  };
}

/**
 * Uploads one or more images and creates a gallery entry for each.
 *
 * New entries are always unpublished: alt text has to be written before a
 * photograph goes on the website, and for a treatment photograph consent has
 * to be recorded. Both happen on the edit screen.
 */
export async function uploadGalleryImagesAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  let stored = 0;

  for (const file of files) {
    if (file.size === 0) continue;

    const result = await storeMedia({
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      maxBytes: MAX_UPLOAD_BYTES,
    });

    if (!result.ok) continue;

    await createGalleryImage(result.id, {
      categoryId: asUuid(formData.get("categoryId")),
      alt: {},
      caption: {},
      kind: oneOf(GALLERY_KINDS, str(formData, "kind", 20)) ?? "clinic",
      consentOnFile: false,
      isPublished: false,
      isFeatured: false,
    });

    stored += 1;
  }

  refreshPublic(PUBLIC_TAGS.gallery);

  redirect(
    stored > 0
      ? `/gallery?notice=imported&count=${stored}`
      : "/gallery?notice=error",
  );
}

export async function updateGalleryImageAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminMutation(formData);

  const dict = getAdminDictionary(await getAdminLocale());
  const id = asUuid(formData.get("id"));
  if (!id) return errorState(dict.errors.notFound);

  const input = readImageForm(formData);
  const errors = new Errors();

  /* Publishing a treatment photograph needs consent on file. Reported against
     the consent field, which is the one that has to change. */
  if (!galleryConsentSatisfied(input)) {
    errors.add("consentOnFile", dict.gallery.consentRequired);
  }

  /* Alt text is required to publish: an unlabelled photograph on the public
     site is unusable with a screen reader. */
  if (input.isPublished && !text(input.alt, "sq") && !text(input.alt, "en")) {
    errors.add("alt.sq", dict.errors.required);
  }

  if (errors.any) {
    return { status: "error", message: dict.errors.body, fieldErrors: errors.all };
  }

  await updateGalleryImage(id, input);
  refreshPublic(PUBLIC_TAGS.gallery);
  redirect(`/gallery/${id}?notice=saved`);
}

export async function toggleGalleryPublishedAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/gallery");

  const changed = await toggleGalleryPublished(id);
  refreshPublic(PUBLIC_TAGS.gallery);

  /* Refused, rather than silently doing nothing: the edit page explains why. */
  redirect(changed ? "/gallery?notice=saved" : `/gallery/${id}?notice=error`);
}

export async function moveGalleryImageAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveGalleryImage(id, direction);
    refreshPublic(PUBLIC_TAGS.gallery);
  }
  redirect("/gallery");
}

/**
 * Deletes a gallery entry, and the file behind it when nothing else uses it.
 *
 * The file is only removed once it is genuinely unreferenced — a photograph
 * shared with a service page keeps its row.
 */
export async function deleteGalleryImageAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/gallery");

  const media = await galleryImageMedia(id);
  await deleteGalleryImage(id);
  if (media) await deleteMediaIfUnused(media.id);

  refreshPublic(PUBLIC_TAGS.gallery);
  redirect("/gallery?notice=deleted");
}

// === Categories ===========================================================

export async function createGalleryCategoryAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const locale = await getAdminLocale();
  const name = localised(formData, "name", 120);
  const slugInput = str(formData, "slug", 80);
  const slug = slugInput === "" ? slugify(text(name, locale)) : slugInput;

  if (slug === "" || !isValidSlug(slug) || !(await galleryCategorySlugAvailable(slug))) {
    redirect("/gallery?notice=error");
  }

  await createGalleryCategory({ slug, name });
  refreshPublic(PUBLIC_TAGS.gallery);
  redirect("/gallery?notice=saved");
}

export async function deleteGalleryCategoryAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteGalleryCategory(id);
    refreshPublic(PUBLIC_TAGS.gallery);
  }
  redirect("/gallery?notice=deleted");
}
