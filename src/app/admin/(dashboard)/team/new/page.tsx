import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";

import { createTeamMemberAction } from "../actions";
import { TeamMemberForm } from "../TeamMemberForm";

export const metadata: Metadata = { title: "Anëtar i re" };

export default async function NewTeamMemberPage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.team.title, href: "/team" },
          { label: dict.team.createTitle },
        ]}
      />
      <PageHeader title={dict.team.createTitle} />

      <div className="mt-6 max-w-4xl">
        <TeamMemberForm
          action={createTeamMemberAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/team"
          localeLabels={localeNames}
          labels={{ team: dict.team, common: dict.common, gallery: dict.gallery }}
        />
      </div>
    </>
  );
}
