import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { serviceOptions } from "@/lib/db/repos/services";
import { text } from "@/lib/db/types";

import { createTreatmentAction } from "../actions";
import { TreatmentForm } from "../TreatmentForm";

export const metadata: Metadata = { title: "Trajtim i re" };

export default async function NewTreatmentPage() {
  const { dict, locale } = await getAdminContext();
  const [services, csrfToken] = await Promise.all([serviceOptions(), readCsrfToken()]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.treatments.title, href: "/treatments" },
          { label: dict.treatments.createTitle },
        ]}
      />
      <PageHeader title={dict.treatments.createTitle} />

      <div className="mt-6 max-w-4xl">
        <TreatmentForm
          action={createTreatmentAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/treatments"
          localeLabels={localeNames}
          serviceOptions={services.map((service) => ({
            value: service.id,
            label: text(service.title, locale),
          }))}
          labels={{
            treatments: dict.treatments,
            common: dict.common,
            gallery: dict.gallery,
            services: dict.services,
          }}
        />
      </div>
    </>
  );
}
