import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconExternal, IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import { ActionLink, Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames, path } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { getService } from "@/lib/db/repos/services";
import { asUuid } from "@/lib/db/sql";
import { text } from "@/lib/db/types";
import { siteUrl } from "@/lib/site";

import { deleteServiceAction, updateServiceAction } from "../actions";
import { ServiceForm } from "../ServiceForm";

export const metadata: Metadata = { title: "Shërbimi" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [service, csrfToken] = await Promise.all([getService(id), readCsrfToken()]);

  if (!service) notFound();

  const csrf = csrfToken ?? "";
  const title = text(service.title, locale) || service.slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.services.title, href: "/services" },
          { label: title },
        ]}
      />

      <PageHeader
        title={title}
        description={dict.services.editTitle}
        actions={
          service.is_active && (
            <ActionLink
              href={`${siteUrl()}${path(locale, `/services/${service.slug}`)}`}
              tone="secondary"
              external
            >
              <IconExternal className="h-4 w-4" />
              {dict.common.onPublicSite}
            </ActionLink>
          )
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.services.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 max-w-4xl">
        <ServiceForm
          action={updateServiceAction}
          csrfToken={csrf}
          service={service}
          cancelHref="/services"
          localeLabels={localeNames}
          labels={{
            services: dict.services,
            common: dict.common,
            gallery: dict.gallery,
          }}
          deleteSlot={
            /* `formAction` sends this button to the delete action instead of
               the form's own, so it reuses the id and CSRF token already in
               the form without saving the record it is about to remove. */
            <ConfirmSubmit
              formAction={deleteServiceAction}
              label={dict.common.delete}
              title={dict.services.deleteConfirm}
              body={dict.services.deleteConfirmBody}
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
