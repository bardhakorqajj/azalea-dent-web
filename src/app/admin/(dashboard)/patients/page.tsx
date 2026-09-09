import type { Metadata } from "next";
import Link from "next/link";

import { formatDateShort } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { FilterBar } from "@/components/admin/FilterBar";
import { IconPatients, IconPlus } from "@/components/admin/Icons";
import { Pagination } from "@/components/admin/Pagination";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Card,
  Dash,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { listPatients } from "@/lib/db/repos/patients";
import { pageNumber } from "@/lib/db/sql";
import { databaseReady } from "@/lib/db/status";

export const metadata: Metadata = { title: "Pacientët" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.patients.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const includeArchived = params.archived === "1";
  const page = await listPatients({
    search: params.q,
    includeArchived,
    page: pageNumber(params.page),
  });
  const hasFilters = Boolean(params.q || includeArchived);

  return (
    <>
      <PageHeader
        title={dict.patients.title}
        description={dict.patients.subtitle}
        actions={
          <ActionLink href="/patients/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.patients.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.patients.savedNotice,
          deleted: dict.patients.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Card className="mt-6">
        <FilterBar
          action="/patients"
          search={params.q}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          submitLabel={dict.common.filter}
          clearHref="/patients"
          clearLabel={dict.common.clearFilters}
          hasFilters={hasFilters}
          selects={[
            {
              name: "archived",
              label: dict.patients.showArchived,
              value: includeArchived ? "1" : "",
              options: [
                { value: "", label: dict.common.no },
                { value: "1", label: dict.common.yes },
              ],
            },
          ]}
        />

        {page.rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.common.noResults : dict.patients.empty}
            hint={hasFilters ? undefined : dict.patients.emptyHint}
            icon={<IconPatients />}
            action={
              hasFilters ? (
                <ActionLink href="/patients" tone="secondary" size="sm">
                  {dict.common.clearFilters}
                </ActionLink>
              ) : (
                <ActionLink href="/patients/new" tone="primary" size="sm">
                  {dict.patients.create}
                </ActionLink>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">{dict.patients.fullName}</th>
                  <th scope="col" className="hidden sm:table-cell">
                    {dict.common.phone}
                  </th>
                  <th scope="col" className="hidden lg:table-cell">
                    {dict.common.email}
                  </th>
                  <th scope="col" className="hidden md:table-cell">
                    {dict.patients.appointmentsCount}
                  </th>
                  <th scope="col" className="hidden md:table-cell">
                    {dict.patients.lastVisit}
                  </th>
                  <th scope="col" className="text-right">
                    {dict.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/patients/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.full_name}
                      </Link>
                      {row.is_archived && (
                        <span className="ml-2">
                          <Badge tone="neutral">{dict.patients.archived}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell">
                      {row.phone ? (
                        <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                          {row.phone}
                        </a>
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      {row.email ? (
                        <a href={`mailto:${row.email}`} className="break-all hover:underline">
                          {row.email}
                        </a>
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td className="tnum hidden md:table-cell">{row.appointment_count}</td>
                    <td className="hidden md:table-cell">
                      {row.last_visit ? (
                        formatDateShort(row.last_visit, locale)
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <ActionLink href={`/patients/${row.id}`} tone="secondary" size="sm">
                          {dict.common.view}
                        </ActionLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <Pagination
              page={page}
              basePath="/patients"
              params={{ q: params.q, archived: params.archived }}
              labels={{
                previous: dict.common.previous,
                next: dict.common.next,
                page: dict.common.page,
                of: dict.common.of,
                results: dict.common.results,
              }}
            />
          </>
        )}
      </Card>
    </>
  );
}
