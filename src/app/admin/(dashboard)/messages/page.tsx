import type { Metadata } from "next";
import Link from "next/link";

import {
  excerpt,
  formatDateTime,
  messageSourceLabel,
  messageStatusLabel,
  messageStatusTone,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { SelectField, TextField, TextareaField } from "@/components/admin/Fields";
import { FilterBar } from "@/components/admin/FilterBar";
import { IconMessages, IconPlus } from "@/components/admin/Icons";
import { Pagination } from "@/components/admin/Pagination";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { listMessages } from "@/lib/db/repos/messages";
import { pageNumber } from "@/lib/db/sql";
import { databaseReady } from "@/lib/db/status";
import { MESSAGE_STATUSES, oneOf } from "@/lib/db/types";

import { createMessageAction } from "./actions";

export const metadata: Metadata = { title: "Mesazhet" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.messages.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const unreadOnly = params.unread === "1";
  const [page, csrfToken] = await Promise.all([
    listMessages({
      search: params.q,
      status: oneOf(MESSAGE_STATUSES, params.status) ?? "all",
      unreadOnly,
      page: pageNumber(params.page),
    }),
    readCsrfToken(),
  ]);

  const csrf = csrfToken ?? "";
  const hasFilters = Boolean(params.q || params.status || unreadOnly);

  return (
    <>
      <PageHeader title={dict.messages.title} description={dict.messages.subtitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.messages.savedNotice,
          deleted: dict.messages.savedNotice,
          error: dict.errors.body,
        }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Card>
            <FilterBar
              action="/messages"
              search={params.q}
              searchLabel={dict.common.search}
              searchPlaceholder={dict.common.searchPlaceholder}
              submitLabel={dict.common.filter}
              clearHref="/messages"
              clearLabel={dict.common.clearFilters}
              hasFilters={hasFilters}
              selects={[
                {
                  name: "status",
                  label: dict.common.status,
                  value: params.status ?? "",
                  options: [
                    { value: "", label: dict.common.all },
                    { value: "new", label: dict.messages.statusNew },
                    { value: "in_progress", label: dict.messages.statusInProgress },
                    { value: "replied", label: dict.messages.statusReplied },
                    { value: "archived", label: dict.messages.statusArchived },
                    { value: "spam", label: dict.messages.statusSpam },
                  ],
                },
                {
                  name: "unread",
                  label: dict.messages.unread,
                  value: unreadOnly ? "1" : "",
                  options: [
                    { value: "", label: dict.common.all },
                    { value: "1", label: dict.messages.unread },
                  ],
                },
              ]}
            />

            {page.rows.length === 0 ? (
              <EmptyState
                title={hasFilters ? dict.common.noResults : dict.messages.empty}
                hint={hasFilters ? undefined : dict.messages.emptyHint}
                icon={<IconMessages />}
              />
            ) : (
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <th scope="col">{dict.common.name}</th>
                      <th scope="col" className="hidden md:table-cell">
                        {dict.messages.message}
                      </th>
                      <th scope="col" className="hidden sm:table-cell">
                        {dict.messages.source}
                      </th>
                      <th scope="col" className="hidden lg:table-cell">
                        {dict.common.date}
                      </th>
                      <th scope="col">{dict.common.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            {!row.is_read && (
                              <span
                                aria-label={dict.messages.unread}
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500 dark:bg-gold-400"
                              />
                            )}
                            <Link
                              href={`/messages/${row.id}`}
                              className={
                                row.is_read
                                  ? "hover:underline"
                                  : "font-semibold hover:underline"
                              }
                            >
                              {row.name}
                            </Link>
                          </span>
                          {row.email && (
                            <span className="mt-0.5 block truncate text-[0.75rem] text-ink-400 dark:text-ink-300">
                              {row.email}
                            </span>
                          )}
                        </td>
                        <td className="hidden max-w-sm md:table-cell">
                          {row.subject && (
                            <span className="block text-[0.875rem] font-medium">
                              {row.subject}
                            </span>
                          )}
                          <span className="text-[0.875rem] text-ink-600 dark:text-bone-200">
                            {excerpt(row.body, 80)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-[0.8125rem] text-ink-500 dark:text-bone-300">
                            {messageSourceLabel(row.source, dict)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell">
                          <span className="tnum text-[0.8125rem] text-ink-500 dark:text-bone-300">
                            {formatDateTime(row.created_at, locale)}
                          </span>
                        </td>
                        <td>
                          <Badge tone={messageStatusTone(row.status)}>
                            {messageStatusLabel(row.status, dict)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>

                <Pagination
                  page={page}
                  basePath="/messages"
                  params={{ q: params.q, status: params.status, unread: params.unread }}
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
        </div>

        <div>
          <Card>
            <CardHeader
              title={dict.messages.createNote}
              hint={dict.messages.createNoteHint}
            />
            <CardBody>
              <form action={createMessageAction} className="space-y-4">
                <input type="hidden" name="csrf" value={csrf} />

                <TextField name="name" label={dict.common.name} required maxLength={160} />

                <SelectField
                  name="source"
                  label={dict.messages.source}
                  defaultValue="phone"
                  options={[
                    { value: "phone", label: dict.messages.sourcePhone },
                    { value: "instagram", label: dict.messages.sourceInstagram },
                    { value: "facebook", label: dict.messages.sourceFacebook },
                    { value: "walk_in", label: dict.messages.sourceWalkIn },
                    { value: "other", label: dict.messages.sourceOther },
                  ]}
                />

                <TextField name="phone" label={dict.common.phone} type="tel" />
                <TextField name="email" label={dict.common.email} type="email" />
                <TextField name="subject" label={dict.messages.subject} maxLength={200} />

                <TextareaField
                  name="body"
                  label={dict.messages.message}
                  required
                  rows={4}
                />

                <SubmitButton
                  pendingLabel={dict.common.saving}
                  tone="secondary"
                  className="w-full"
                >
                  <IconPlus className="h-4 w-4" />
                  {dict.common.save}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
