import type { Metadata } from "next";
import Link from "next/link";

import { getAdminContext } from "@/admin/locale";
import { FilterBar } from "@/components/admin/FilterBar";
import { IconPlus, IconTreatments } from "@/components/admin/Icons";
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
import { serviceOptions } from "@/lib/db/repos/services";
import { listTreatments } from "@/lib/db/repos/treatments";
import { pageNumber } from "@/lib/db/sql";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";

export const metadata: Metadata = { title: "Trajtimet" };

export default async function TreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.treatments.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [page, services] = await Promise.all([
    listTreatments({
      search: params.q,
      serviceId: params.service,
      page: pageNumber(params.page),
    }),
    serviceOptions(),
  ]);

  const hasFilters = Boolean(params.q || params.service);

  return (
    <>
      <PageHeader
        title={dict.treatments.title}
        description={dict.treatments.subtitle}
        actions={
          <ActionLink href="/treatments/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.treatments.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.treatments.savedNotice,
          deleted: dict.treatments.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Card className="mt-6">
        <FilterBar
          action="/treatments"
          search={params.q}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          submitLabel={dict.common.filter}
          clearHref="/treatments"
          clearLabel={dict.common.clearFilters}
          hasFilters={hasFilters}
          selects={[
            {
              name: "service",
              label: dict.treatments.parentService,
              value: params.service ?? "",
              options: [
                { value: "", label: dict.common.all },
                ...services.map((service) => ({
                  value: service.id,
                  label: text(service.title, locale),
                })),
              ],
            },
          ]}
        />

        {page.rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.common.noResults : dict.treatments.empty}
            hint={hasFilters ? undefined : dict.treatments.emptyHint}
            icon={<IconTreatments />}
            action={
              hasFilters ? (
                <ActionLink href="/treatments" tone="secondary" size="sm">
                  {dict.common.clearFilters}
                </ActionLink>
              ) : (
                <ActionLink href="/treatments/new" tone="primary" size="sm">
                  {dict.treatments.create}
                </ActionLink>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">{dict.common.title}</th>
                  <th scope="col" className="hidden sm:table-cell">
                    {dict.treatments.parentService}
                  </th>
                  <th scope="col" className="hidden lg:table-cell">
                    {dict.common.price}
                  </th>
                  <th scope="col">{dict.common.status}</th>
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
                        href={`/treatments/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {text(row.title, locale) || row.slug}
                      </Link>
                      {row.is_featured && (
                        <span className="mt-0.5 block">
                          <Badge tone="gold">{dict.common.featured}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell">
                      {row.service_title ? (
                        text(row.service_title, locale)
                      ) : (
                        <span className="text-[0.8125rem] text-ink-400 dark:text-ink-300">
                          {dict.treatments.noParentService}
                        </span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      {text(row.price_text, locale) || <Dash />}
                    </td>
                    <td>
                      <Badge tone={row.is_active ? "positive" : "neutral"}>
                        {row.is_active ? dict.common.active : dict.common.inactive}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <ActionLink
                          href={`/treatments/${row.id}`}
                          tone="secondary"
                          size="sm"
                        >
                          {dict.common.edit}
                        </ActionLink>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <Pagination
              page={page}
              basePath="/treatments"
              params={{ q: params.q, service: params.service }}
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
