import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";

import { createPromotionAction } from "../actions";
import { PromotionForm } from "../PromotionForm";

export const metadata: Metadata = { title: "Promocion i re" };

export default async function NewPromotionPage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.promotions.title, href: "/promotions" },
          { label: dict.promotions.createTitle },
        ]}
      />
      <PageHeader title={dict.promotions.createTitle} />

      <div className="mt-6 max-w-4xl">
        <PromotionForm
          action={createPromotionAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/promotions"
          localeLabels={localeNames}
          labels={{
            promotions: dict.promotions,
            common: dict.common,
            gallery: dict.gallery,
          }}
        />
      </div>
    </>
  );
}
