import type { Metadata } from "next";
import Link from "next/link";

import { getAdminContext } from "@/admin/locale";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTeam,
} from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  TableWrap,
  buttonClass,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { listTeam } from "@/lib/db/repos/team";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";
import { initials } from "@/lib/utils";

import { moveTeamMemberAction } from "./actions";

export const metadata: Metadata = { title: "Ekipi" };

/**
 * The team.
 *
 * Never paged: it is one clinic's dentists, and a pager over four rows is
 * furniture rather than a feature.
 */
export default async function TeamPage() {
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.team.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [members, csrfToken] = await Promise.all([listTeam(), readCsrfToken()]);
  const csrf = csrfToken ?? "";

  return (
    <>
      <PageHeader
        title={dict.team.title}
        description={dict.team.subtitle}
        actions={
          <ActionLink href="/team/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.team.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.team.savedNotice,
          deleted: dict.team.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Card className="mt-6">
        {members.length === 0 ? (
          <EmptyState
            title={dict.team.empty}
            hint={dict.team.emptyHint}
            icon={<IconTeam />}
            action={
              <ActionLink href="/team/new" tone="primary" size="sm">
                {dict.team.create}
              </ActionLink>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th scope="col" className="w-16">
                  {dict.common.order}
                </th>
                <th scope="col">{dict.common.name}</th>
                <th scope="col" className="hidden sm:table-cell">
                  {dict.team.role}
                </th>
                <th scope="col">{dict.common.status}</th>
                <th scope="col" className="text-right">
                  {dict.common.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex gap-1">
                      <MoveButton
                        id={member.id}
                        csrf={csrf}
                        direction="up"
                        label={dict.common.moveUp}
                        disabled={index === 0}
                      />
                      <MoveButton
                        id={member.id}
                        csrf={csrf}
                        direction="down"
                        label={dict.common.moveDown}
                        disabled={index === members.length - 1}
                      />
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-3">
                      <Portrait photoId={member.photo_id} name={member.name} />
                      <Link
                        href={`/team/${member.id}`}
                        className="font-medium hover:underline"
                      >
                        {member.name}
                      </Link>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="text-[0.875rem] text-ink-600 dark:text-bone-200">
                      {text(member.role, locale)}
                    </span>
                  </td>
                  <td>
                    <Badge tone={member.is_active ? "positive" : "neutral"}>
                      {member.is_active ? dict.common.active : dict.common.inactive}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <ActionLink href={`/team/${member.id}`} tone="secondary" size="sm">
                        {dict.common.edit}
                      </ActionLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}

/**
 * A thumbnail, or the monogram the public site falls back to.
 *
 * A plain `<img>`: it is a 36-pixel square in a private dashboard, and routing
 * it through the optimiser would cost a request per row for no visible gain.
 */
function Portrait({ photoId, name }: { photoId: string | null; name: string }) {
  if (!photoId) {
    return (
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 font-display text-[0.8125rem] text-gold-400 dark:bg-ink-950"
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a 36px dashboard thumbnail
    <img
      src={`/api/media/${photoId}`}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  );
}

function MoveButton({
  id,
  csrf,
  direction,
  label,
  disabled,
}: {
  id: string;
  csrf: string;
  direction: "up" | "down";
  label: string;
  disabled: boolean;
}) {
  return (
    <form action={moveTeamMemberAction}>
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        title={label}
        className={buttonClass("quiet", "sm", "min-h-7 px-1.5")}
      >
        {direction === "up" ? (
          <IconChevronLeft className="h-3.5 w-3.5 rotate-90" />
        ) : (
          <IconChevronRight className="h-3.5 w-3.5 rotate-90" />
        )}
      </button>
    </form>
  );
}
