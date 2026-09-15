import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatDateTime, reviewSourceLabel } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import { Breadcrumbs, Callout, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { getReview } from "@/lib/db/repos/reviews";
import { asUuid } from "@/lib/db/sql";
import { interpolate } from "@/lib/utils";

import { deleteReviewAction, updateReviewAction } from "../actions";
import { ReviewForm } from "../ReviewForm";

export const metadata: Metadata = { title: "Vlerësimi" };

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [review, csrfToken] = await Promise.all([getReview(id), readCsrfToken()]);
  if (!review) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.reviews.title, href: "/reviews" },
          { label: review.author_name },
        ]}
      />
      <PageHeader title={review.author_name} description={dict.reviews.editTitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.reviews.savedNotice, error: dict.errors.body }}
      />

      {/* Provenance, stated on the record itself. */}
      <Callout tone="info" className="mt-5">
        {review.imported_at
          ? interpolate(dict.reviews.importedNotice, {
              source: reviewSourceLabel(review.source, dict),
              date: formatDateTime(review.imported_at, locale),
            })
          : dict.reviews.manualNotice}
      </Callout>

      <div className="mt-6 max-w-3xl">
        <ReviewForm
          action={updateReviewAction}
          csrfToken={csrfToken ?? ""}
          review={review}
          cancelHref="/reviews"
          localeLabels={localeNames}
          labels={{ reviews: dict.reviews, common: dict.common }}
          deleteSlot={
            <ConfirmSubmit
              formAction={deleteReviewAction}
              label={dict.common.delete}
              title={dict.reviews.deleteConfirm}
              confirmLabel={dict.common.delete}
              cancelLabel={dict.common.cancel}
              icon={<IconTrash className="h-4 w-4" />}
            />
          }
        />
      </div>
    </>
  );
}
