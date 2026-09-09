import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";

import { createReviewAction } from "../actions";
import { ReviewForm } from "../ReviewForm";

export const metadata: Metadata = { title: "Vlerësim i re" };

export default async function NewReviewPage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.reviews.title, href: "/reviews" },
          { label: dict.reviews.createTitle },
        ]}
      />
      <PageHeader title={dict.reviews.createTitle} />

      <div className="mt-6 max-w-3xl">
        <ReviewForm
          action={createReviewAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/reviews"
          localeLabels={localeNames}
          labels={{ reviews: dict.reviews, common: dict.common }}
        />
      </div>
    </>
  );
}
