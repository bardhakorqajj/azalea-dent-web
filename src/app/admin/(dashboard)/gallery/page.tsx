import type { Metadata } from "next";
import Link from "next/link";

import { galleryKindLabel } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { LocalisedField, SelectField, TextField } from "@/components/admin/Fields";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  IconChevronLeft,
  IconChevronRight,
  IconGallery,
  IconPlus,
  IconUpload,
} from "@/components/admin/Icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  buttonClass,
} from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { formatBytes, MAX_UPLOAD_BYTES } from "@/lib/admin/image";
import { readCsrfToken } from "@/lib/admin/session";
import {
  galleryCounts,
  listGalleryCategories,
  listGalleryImages,
} from "@/lib/db/repos/gallery";
import { databaseReady } from "@/lib/db/status";
import { GALLERY_KINDS, oneOf, text } from "@/lib/db/types";

import {
  createGalleryCategoryAction,
  deleteGalleryCategoryAction,
  moveGalleryImageAction,
  toggleGalleryPublishedAction,
  uploadGalleryImagesAction,
} from "./actions";

export const metadata: Metadata = { title: "Galeria" };

/**
 * The gallery.
 *
 * A grid rather than a table: these are photographs, and a row of filenames is
 * no way to choose between them. The upload form posts straight to a server
 * action with `multiple`, so several photos can be added at once and it works
 * without JavaScript.
 */
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.gallery.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const kind = oneOf(GALLERY_KINDS, params.kind);

  const [images, categories, counts, csrfToken] = await Promise.all([
    listGalleryImages({
      categoryId: params.category,
      kind: kind ?? "all",
    }),
    listGalleryCategories(),
    galleryCounts(),
    readCsrfToken(),
  ]);

  const csrf = csrfToken ?? "";
  const sizeLimit = formatBytes(MAX_UPLOAD_BYTES);

  const categoryOptions = [
    { value: "", label: dict.gallery.noCategory },
    ...categories.map((category) => ({
      value: category.id,
      label: text(category.name, locale) || category.slug,
    })),
  ];

  const kindOptions = GALLERY_KINDS.map((value) => ({
    value,
    label: galleryKindLabel(value, dict),
  }));

  return (
    <>
      <PageHeader
        title={dict.gallery.title}
        description={
          counts.total > 0
            ? `${counts.published}/${counts.total} ${dict.common.published.toLowerCase()}`
            : dict.gallery.subtitle
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.gallery.savedNotice,
          deleted: dict.gallery.savedNotice,
          imported: dict.services.importDone,
          error: dict.gallery.uploadFailed,
        }}
      />

      <Callout tone="warning" className="mt-5">
        {dict.gallery.privacyNotice}
      </Callout>

      {counts.awaitingConsent > 0 && (
        <Callout tone="info" className="mt-3">
          {dict.gallery.consentHint}
        </Callout>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-3">
          {/* --- Filters ------------------------------------------------- */}
          <Card>
            <form action="/gallery" method="get" className="flex flex-wrap items-end gap-3 px-5 py-4">
              <div className="min-w-0 basis-48">
                <label htmlFor="filter-category" className="admin-label mb-1.5">
                  {dict.gallery.category}
                </label>
                <select
                  id="filter-category"
                  name="category"
                  defaultValue={params.category ?? ""}
                  className="admin-control admin-select"
                >
                  <option value="">{dict.common.all}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {text(category.name, locale) || category.slug}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 basis-48">
                <label htmlFor="filter-kind" className="admin-label mb-1.5">
                  {dict.gallery.kind}
                </label>
                <select
                  id="filter-kind"
                  name="kind"
                  defaultValue={params.kind ?? ""}
                  className="admin-control admin-select"
                >
                  <option value="">{dict.common.all}</option>
                  {kindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className={buttonClass("secondary", "md")}>
                {dict.common.filter}
              </button>
              {(params.category || params.kind) && (
                <Link href="/gallery" className={buttonClass("quiet", "md")}>
                  {dict.common.clearFilters}
                </Link>
              )}
            </form>
          </Card>

          {/* --- The grid ----------------------------------------------- */}
          {images.length === 0 ? (
            <Card>
              <EmptyState
                title={dict.gallery.empty}
                hint={dict.gallery.emptyHint.replace("{size}", sizeLimit)}
                icon={<IconGallery />}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image, index) => (
                <Card key={image.id} className="overflow-hidden" as="article">
                  <Link href={`/gallery/${image.id}`} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a dashboard thumbnail from an id-addressed route */}
                    <img
                      src={`/api/media/${image.media_id}`}
                      alt={text(image.alt, locale)}
                      className="aspect-[4/3] w-full bg-bone-200 object-cover dark:bg-ink-800"
                    />
                  </Link>

                  <div className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={image.is_published ? "positive" : "neutral"}>
                        {image.is_published
                          ? dict.common.published
                          : dict.common.unpublished}
                      </Badge>
                      {image.kind === "work" && (
                        <Badge tone={image.consent_on_file ? "info" : "danger"}>
                          {galleryKindLabel(image.kind, dict)}
                        </Badge>
                      )}
                      {image.is_featured && (
                        <Badge tone="gold">{dict.common.featured}</Badge>
                      )}
                    </div>

                    {!text(image.alt, locale) && (
                      <p className="mt-1.5 text-[0.75rem] text-[#96371f] dark:text-[#e8a08d]">
                        {dict.gallery.altText}: {dict.errors.required.toLowerCase()}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <MoveButton
                          id={image.id}
                          csrf={csrf}
                          direction="up"
                          label={dict.common.moveUp}
                          disabled={index === 0}
                        />
                        <MoveButton
                          id={image.id}
                          csrf={csrf}
                          direction="down"
                          label={dict.common.moveDown}
                          disabled={index === images.length - 1}
                        />
                      </div>

                      <form action={toggleGalleryPublishedAction}>
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="id" value={image.id} />
                        <button
                          type="submit"
                          className={buttonClass("quiet", "sm", "min-h-7 px-2 text-[0.75rem]")}
                        >
                          {image.is_published
                            ? dict.reviews.unpublish
                            : dict.reviews.publish}
                        </button>
                      </form>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* --- Upload and categories ----------------------------------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader title={dict.gallery.upload} />
            <CardBody>
              <form
                action={uploadGalleryImagesAction}
                encType="multipart/form-data"
                className="space-y-4"
              >
                <input type="hidden" name="csrf" value={csrf} />

                <div>
                  <label htmlFor="gallery-files" className="admin-label mb-1.5">
                    {dict.common.image}
                  </label>
                  <input
                    id="gallery-files"
                    name="files"
                    type="file"
                    multiple
                    required
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="admin-control py-2 text-[0.8125rem] file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-bone-50 dark:file:bg-gold-400 dark:file:text-ink-950"
                  />
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-500 dark:text-bone-300">
                    {dict.gallery.emptyHint.replace("{size}", sizeLimit)}
                  </p>
                </div>

                <SelectField
                  name="kind"
                  label={dict.gallery.kind}
                  defaultValue="clinic"
                  options={kindOptions}
                />

                <SelectField
                  name="categoryId"
                  label={dict.gallery.category}
                  options={categoryOptions}
                />

                <SubmitButton
                  pendingLabel={dict.gallery.uploading}
                  tone="primary"
                  className="w-full"
                >
                  <IconUpload className="h-4 w-4" />
                  {dict.gallery.upload}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.gallery.categories} />
            {categories.length > 0 && (
              <ul className="admin-divide divide-y">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between gap-2 px-5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.875rem]">
                        {text(category.name, locale) || category.slug}
                      </span>
                      <span className="tnum block text-[0.75rem] text-ink-400 dark:text-ink-300">
                        {category.image_count}
                      </span>
                    </span>
                    <form action={deleteGalleryCategoryAction}>
                      <input type="hidden" name="csrf" value={csrf} />
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmit
                        label={dict.common.delete}
                        title={dict.common.delete}
                        confirmLabel={dict.common.delete}
                        cancelLabel={dict.common.cancel}
                        tone="quiet"
                      />
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <CardBody>
              <form action={createGalleryCategoryAction} className="space-y-4">
                <input type="hidden" name="csrf" value={csrf} />
                <LocalisedField
                  name="name"
                  label={dict.gallery.createCategory}
                  localeLabels={localeNames}
                />
                <TextField name="slug" label={dict.common.slug} />
                <SubmitButton
                  pendingLabel={dict.common.saving}
                  tone="secondary"
                  size="sm"
                  className="w-full"
                >
                  <IconPlus className="h-4 w-4" />
                  {dict.common.create}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function MoveButton({
  id,
  csrf,
  direction,
  label,
  disabled,
}: {
  id: string;
  csrf: string;
  direction: "up" | "down";
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={moveGalleryImageAction}>
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        title={label}
        className={buttonClass("quiet", "sm", "min-h-7 px-1.5")}
      >
        {direction === "up" ? (
          <IconChevronLeft className="h-3.5 w-3.5 rotate-90" />
        ) : (
          <IconChevronRight className="h-3.5 w-3.5 rotate-90" />
        )}
      </button>
    </form>
  );
}
