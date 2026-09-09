import type { Metadata } from "next";
import Link from "next/link";

import { formatDateTime } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { FilterBar } from "@/components/admin/FilterBar";
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconPlus,
  IconServices,
} from "@/components/admin/Icons";
import { Pagination } from "@/components/admin/Pagination";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Card,
  Callout,
  EmptyState,
  PageHeader,
  TableWrap,
  buttonClass,
} from "@/components/admin/Ui";
import { path } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { siteContentImportable } from "@/lib/admin/import-site-content";
import { listServices } from "@/lib/db/repos/services";
import { pageNumber } from "@/lib/db/sql";
import { databaseReady } from "@/lib/db/status";
import { missingLocales, text } from "@/lib/db/types";
import { siteUrl } from "@/lib/site";

import {
  importSiteContentAction,
  moveServiceAction,
  toggleServiceActiveAction,
} from "./actions";

export const metadata: Metadata = { title: "Shërbimet" };

/**
 * The service list.
 *
 * The order here is the order the public website lists them in, which is why
 * the reorder arrows are on the row rather than hidden inside the edit form.
 */
export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.services.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [page, csrfToken, importable] = await Promise.all([
    listServices({ search: params.q, page: pageNumber(params.page) }),
    readCsrfToken(),
    siteContentImportable(),
  ]);

  const csrf = csrfToken ?? "";
  const hasFilters = Boolean(params.q);

  const importButton = importable ? (
    <form action={importSiteContentAction}>
      <input type="hidden" name="csrf" value={csrf} />
      <button type="submit" className={buttonClass("secondary", "md")}>
        {dict.services.importFromSite}
      </button>
    </form>
  ) : null;

  return (
    <>
      <PageHeader
        title={dict.services.title}
        description={dict.services.subtitle}
        actions={
          <>
            {importButton}
            <ActionLink href="/services/new" tone="primary">
              <IconPlus className="h-4 w-4" />
              {dict.services.create}
            </ActionLink>
          </>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.services.savedNotice,
          deleted: dict.services.savedNotice,
          imported: dict.services.importDone,
          error: dict.errors.body,
        }}
      />

      {importable && page.total > 0 && (
        <Callout tone="info" className="mt-5">
          {dict.services.importFromSiteHint}
        </Callout>
      )}

      <Card className="mt-6">
        <FilterBar
          action="/services"
          search={params.q}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          submitLabel={dict.common.filter}
          clearHref="/services"
          clearLabel={dict.common.clearFilters}
          hasFilters={hasFilters}
        />

        {page.rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.common.noResults : dict.services.empty}
            hint={hasFilters ? undefined : dict.services.emptyHint}
            icon={<IconServices />}
            action={
              hasFilters ? (
                <ActionLink href="/services" tone="secondary" size="sm">
                  {dict.common.clearFilters}
                </ActionLink>
              ) : (
                <div className="flex flex-wrap justify-center gap-2.5">
                  {importButton}
                  <ActionLink href="/services/new" tone="primary" size="sm">
                    {dict.services.create}
                  </ActionLink>
                </div>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col" className="w-16">
                    {dict.common.order}
                  </th>
                  <th scope="col">{dict.common.title}</th>
                  <th scope="col" className="hidden lg:table-cell">
                    {dict.common.slug}
                  </th>
                  <th scope="col" className="hidden md:table-cell">
                    {dict.common.updatedAt}
                  </th>
                  <th scope="col">{dict.common.status}</th>
                  <th scope="col" className="text-right">
                    {dict.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row, index) => {
                  const missing = missingLocales(row.title);

                  return (
                    <tr key={row.id}>
                      <td>
                        {/* Reordering is two small posts rather than a
                            drag-and-drop, so it works on a phone and with no
                            JavaScript at all. */}
                        <div className="flex gap-1">
                          <ReorderButton
                            id={row.id}
                            csrf={csrf}
                            direction="up"
                            label={dict.common.moveUp}
                            disabled={index === 0 && page.page === 1}
                          />
                          <ReorderButton
                            id={row.id}
                            csrf={csrf}
                            direction="down"
                            label={dict.common.moveDown}
                            disabled={
                              index === page.rows.length - 1 &&
                              page.page === page.pageCount
                            }
                          />
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/services/${row.id}`}
                          className="font-medium hover:underline"
                        >
                          {text(row.title, locale) || row.slug}
                        </Link>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2">
                          {row.is_featured && (
                            <Badge tone="gold">{dict.common.featured}</Badge>
                          )}
                          {missing.length > 0 && (
                            <span className="text-[0.75rem] text-ink-400 dark:text-ink-300">
                              {dict.common.translationMissing}: {missing.join(", ")}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <code className="text-[0.8125rem] text-ink-500 dark:text-bone-300">
                          {row.slug}
                        </code>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-[0.8125rem] text-ink-500 dark:text-bone-300">
                          {formatDateTime(row.updated_at, locale)}
                        </span>
                      </td>
                      <td>
                        <form action={toggleServiceActiveAction}>
                          <input type="hidden" name="csrf" value={csrf} />
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            title={row.is_active ? dict.common.inactive : dict.common.active}
                          >
                            <Badge tone={row.is_active ? "positive" : "neutral"}>
                              {row.is_active ? dict.common.active : dict.common.inactive}
                            </Badge>
                          </button>
                        </form>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {row.is_active && (
                            <a
                              href={`${siteUrl()}${path(locale, `/services/${row.slug}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={dict.common.onPublicSite}
                              className={buttonClass("quiet", "sm")}
                            >
                              <IconExternal className="h-4 w-4" />
                            </a>
                          )}
                          <ActionLink
                            href={`/services/${row.id}`}
                            tone="secondary"
                            size="sm"
                          >
                            {dict.common.edit}
                          </ActionLink>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>

            <Pagination
              page={page}
              basePath="/services"
              params={{ q: params.q }}
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

function ReorderButton({
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
    <form action={moveServiceAction}>
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
