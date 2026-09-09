import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { getTeamMember } from "@/lib/db/repos/team";
import { asUuid } from "@/lib/db/sql";

import { deleteTeamMemberAction, updateTeamMemberAction } from "../actions";
import { TeamMemberForm } from "../TeamMemberForm";

export const metadata: Metadata = { title: "Anëtari" };

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict } = await getAdminContext();
  const [member, csrfToken] = await Promise.all([getTeamMember(id), readCsrfToken()]);
  if (!member) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.team.title, href: "/team" },
          { label: member.name },
        ]}
      />
      <PageHeader title={member.name} description={dict.team.editTitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.team.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 max-w-4xl">
        <TeamMemberForm
          action={updateTeamMemberAction}
          csrfToken={csrfToken ?? ""}
          member={member}
          cancelHref="/team"
          localeLabels={localeNames}
          labels={{ team: dict.team, common: dict.common, gallery: dict.gallery }}
          deleteSlot={
            <ConfirmSubmit
              formAction={deleteTeamMemberAction}
              label={dict.common.delete}
              title={dict.team.deleteConfirm}
              body={dict.team.deleteConfirmBody}
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
