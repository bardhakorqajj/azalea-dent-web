import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";

import { createPatientAction } from "../actions";
import { PatientForm } from "../PatientForm";

export const metadata: Metadata = { title: "Pacient i re" };

export default async function NewPatientPage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.patients.title, href: "/patients" },
          { label: dict.patients.createTitle },
        ]}
      />
      <PageHeader title={dict.patients.createTitle} />

      <div className="mt-6 max-w-3xl">
        <PatientForm
          action={createPatientAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/patients"
          labels={{ patients: dict.patients, common: dict.common }}
        />
      </div>
    </>
  );
}
