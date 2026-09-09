import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { serviceOptions } from "@/lib/db/repos/services";
import { teamOptions } from "@/lib/db/repos/team";
import { text } from "@/lib/db/types";

import { createAppointmentAction } from "../actions";
import { AppointmentForm } from "../AppointmentForm";

export const metadata: Metadata = { title: "Takim i re" };

export default async function NewAppointmentPage() {
  const { dict, locale } = await getAdminContext();

  const [services, team, csrfToken] = await Promise.all([
    serviceOptions(),
    teamOptions(),
    readCsrfToken(),
  ]);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.appointments.title, href: "/appointments" },
          { label: dict.appointments.createTitle },
        ]}
      />

      <PageHeader title={dict.appointments.createTitle} />

      <div className="mt-6 max-w-3xl">
        <AppointmentForm
          action={createAppointmentAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/appointments"
          labels={{ appointments: dict.appointments, common: dict.common }}
          serviceOptions={services.map((service) => ({
            value: service.id,
            label: text(service.title, locale),
          }))}
          teamOptions={team.map((member) => ({
            value: member.id,
            label: member.name,
          }))}
        />
      </div>
    </>
  );
}
