import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { serviceOptions } from "@/lib/db/repos/services";
import { getTreatment } from "@/lib/db/repos/treatments";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";

import { deleteTreatmentAction, updateTreatmentAction } from "../actions";
import { TreatmentForm } from "../TreatmentForm";

export const metadata: Metadata = { title: "Trajtimi" };

export default async function EditTreatmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [treatment, services, csrfToken] = await Promise.all([
    getTreatment(id),
    serviceOptions(),
    readCsrfToken(),
  ]);
  if (!treatment) notFound();

  const title = text(treatment.title, locale) || treatment.slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.treatments.title, href: "/treatments" },
          { label: title },
        ]}
      />
      <PageHeader title={title} description={dict.treatments.editTitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.treatments.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 max-w-4xl">
        <TreatmentForm
          action={updateTreatmentAction}
          csrfToken={csrfToken ?? ""}
          treatment={treatment}
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
          deleteSlot={
            <ConfirmSubmit
              formAction={deleteTreatmentAction}
              label={dict.common.delete}
              title={dict.treatments.deleteConfirm}
              body={dict.treatments.deleteConfirmBody}
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
