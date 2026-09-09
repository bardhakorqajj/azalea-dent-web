import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { getPromotion } from "@/lib/db/repos/promotions";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";

import { deletePromotionAction, updatePromotionAction } from "../actions";
import { PromotionForm } from "../PromotionForm";

export const metadata: Metadata = { title: "Promocioni" };

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [promotion, csrfToken] = await Promise.all([getPromotion(id), readCsrfToken()]);
  if (!promotion) notFound();

  const title = text(promotion.title, locale) || promotion.slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.promotions.title, href: "/promotions" },
          { label: title },
        ]}
      />
      <PageHeader title={title} description={dict.promotions.editTitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.promotions.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 max-w-4xl">
        <PromotionForm
          action={updatePromotionAction}
          csrfToken={csrfToken ?? ""}
          promotion={promotion}
          cancelHref="/promotions"
          localeLabels={localeNames}
          labels={{
            promotions: dict.promotions,
            common: dict.common,
            gallery: dict.gallery,
          }}
          deleteSlot={
            <ConfirmSubmit
              formAction={deletePromotionAction}
              label={dict.common.delete}
              title={dict.promotions.deleteConfirm}
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
