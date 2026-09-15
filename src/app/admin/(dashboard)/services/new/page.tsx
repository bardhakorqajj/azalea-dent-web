import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";

import { createServiceAction } from "../actions";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Shërbim i re" };

export default async function NewServicePage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.services.title, href: "/services" },
          { label: dict.services.createTitle },
        ]}
      />

      <PageHeader title={dict.services.createTitle} />

      <div className="mt-6 max-w-4xl">
        <ServiceForm
          action={createServiceAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/services"
          localeLabels={localeNames}
          labels={{
            services: dict.services,
            common: dict.common,
            gallery: dict.gallery,
          }}
        />
      </div>
    </>
  );
}
