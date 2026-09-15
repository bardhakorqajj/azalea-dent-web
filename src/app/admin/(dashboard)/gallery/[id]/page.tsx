import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { galleryKindLabel } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  Dash,
  FieldValue,
  PageHeader,
} from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { formatBytes } from "@/lib/admin/image";
import { readCsrfToken } from "@/lib/admin/session";
import { getGalleryImage, listGalleryCategories } from "@/lib/db/repos/gallery";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";

import { deleteGalleryImageAction, updateGalleryImageAction } from "../actions";
import { GalleryImageForm } from "./GalleryImageForm";

export const metadata: Metadata = { title: "Fotografia" };

export default async function EditGalleryImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [image, categories, csrfToken] = await Promise.all([
    getGalleryImage(id),
    listGalleryCategories(),
    readCsrfToken(),
  ]);
  if (!image) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.gallery.title, href: "/gallery" },
          { label: image.filename },
        ]}
      />

      <PageHeader
        title={dict.gallery.editTitle}
        description={image.filename}
        actions={
          <Badge tone={image.is_published ? "positive" : "neutral"}>
            {image.is_published ? dict.common.published : dict.common.unpublished}
          </Badge>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.gallery.savedNotice,
          error: dict.gallery.consentRequired,
        }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GalleryImageForm
            action={updateGalleryImageAction}
            csrfToken={csrfToken ?? ""}
            image={image}
            cancelHref="/gallery"
            localeLabels={localeNames}
            labels={{ gallery: dict.gallery, common: dict.common }}
            categoryOptions={[
              { value: "", label: dict.gallery.noCategory },
              ...categories.map((category) => ({
                value: category.id,
                label: text(category.name, locale) || category.slug,
              })),
            ]}
            deleteSlot={
              <ConfirmSubmit
                formAction={deleteGalleryImageAction}
                label={dict.common.delete}
                title={dict.gallery.deleteConfirm}
                body={dict.gallery.deleteConfirmBody}
                confirmLabel={dict.common.delete}
                cancelLabel={dict.common.cancel}
                icon={<IconTrash className="h-4 w-4" />}
              />
            }
          />
        </div>

        <div>
          <Card>
            <CardHeader title={dict.common.image} />
            {/* eslint-disable-next-line @next/next/no-img-element -- a preview of an id-addressed upload */}
            <img
              src={`/api/media/${image.media_id}`}
              alt={text(image.alt, locale)}
              className="w-full bg-bone-200 object-contain dark:bg-ink-800"
            />
            <CardBody>
              <dl className="space-y-4">
                <FieldValue label={dict.gallery.kind}>
                  {galleryKindLabel(image.kind, dict)}
                </FieldValue>
                <FieldValue label={dict.gallery.dimensions}>
                  {image.width && image.height ? (
                    <span className="tnum">
                      {image.width} × {image.height}
                    </span>
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.gallery.fileSize}>
                  <span className="tnum">{formatBytes(image.byte_size)}</span>
                </FieldValue>
                <FieldValue label={dict.gallery.category}>
                  {image.category_name
                    ? text(image.category_name, locale)
                    : dict.gallery.noCategory}
                </FieldValue>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
