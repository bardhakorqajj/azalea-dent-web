import type { Metadata } from "next";
import Link from "next/link";

import { excerpt, formatDateTime, socialStatusLabel, socialStatusTone } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { FilterBar } from "@/components/admin/FilterBar";
import { IconPlus, IconSocial } from "@/components/admin/Icons";
import { Pagination } from "@/components/admin/Pagination";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Callout,
  Card,
  Dash,
  EmptyState,
  PageHeader,
  TableWrap,
} from "@/components/admin/Ui";
import { listSocialPosts, socialCounts } from "@/lib/db/repos/social";
import { pageNumber } from "@/lib/db/sql";
import { databaseReady } from "@/lib/db/status";
import { oneOf, SOCIAL_PLATFORMS, SOCIAL_STATUSES } from "@/lib/db/types";

export const metadata: Metadata = { title: "Rrjetet sociale" };

/**
 * The social post queue.
 *
 * Ordered by where each post is in the workflow rather than by date, so what
 * is waiting for the owner's approval sits at the top of the page.
 */
export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.social.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [page, counts] = await Promise.all([
    listSocialPosts({
      search: params.q,
      status: oneOf(SOCIAL_STATUSES, params.status) ?? "all",
      platform: oneOf(SOCIAL_PLATFORMS, params.platform) ?? "all",
      page: pageNumber(params.page),
    }),
    socialCounts(),
  ]);

  const hasFilters = Boolean(params.q || params.status || params.platform);

  return (
    <>
      <PageHeader
        title={dict.social.title}
        description={
          counts.forApproval > 0
            ? `${counts.forApproval} ${dict.social.statusReady.toLowerCase()}`
            : dict.social.subtitle
        }
        actions={
          <ActionLink href="/social/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.social.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.social.savedNotice,
          deleted: dict.social.savedNotice,
          error: dict.errors.body,
        }}
      />

      {/* The one thing anyone using this section needs to know. */}
      <Callout tone="warning" title={dict.social.publishingNotice} className="mt-5">
        {dict.social.publishingNoticeBody}
      </Callout>

      <Card className="mt-6">
        <FilterBar
          action="/social"
          search={params.q}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          submitLabel={dict.common.filter}
          clearHref="/social"
          clearLabel={dict.common.clearFilters}
          hasFilters={hasFilters}
          selects={[
            {
              name: "status",
              label: dict.common.status,
              value: params.status ?? "",
              options: [
                { value: "", label: dict.common.all },
                { value: "draft", label: dict.social.statusDraft },
                { value: "ready_for_approval", label: dict.social.statusReady },
                { value: "approved", label: dict.social.statusApproved },
                { value: "scheduled", label: dict.social.statusScheduled },
                { value: "published", label: dict.social.statusPublished },
                { value: "failed", label: dict.social.statusFailed },
              ],
            },
            {
              name: "platform",
              label: dict.social.platform,
              value: params.platform ?? "",
              options: [
                { value: "", label: dict.common.all },
                { value: "instagram", label: "Instagram" },
                { value: "facebook", label: "Facebook" },
                { value: "tiktok", label: "TikTok" },
              ],
            },
          ]}
        />

        {page.rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.common.noResults : dict.social.empty}
            hint={hasFilters ? undefined : dict.social.emptyHint}
            icon={<IconSocial />}
            action={
              hasFilters ? (
                <ActionLink href="/social" tone="secondary" size="sm">
                  {dict.common.clearFilters}
                </ActionLink>
              ) : (
                <ActionLink href="/social/new" tone="primary" size="sm">
                  {dict.social.create}
                </ActionLink>
              )
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th scope="col">{dict.social.caption}</th>
                  <th scope="col" className="hidden sm:table-cell">
                    {dict.social.platform}
                  </th>
                  <th scope="col" className="hidden lg:table-cell">
                    {dict.social.scheduledFor}
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
                    <td className="max-w-md">
                      <Link
                        href={`/social/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.headline ?? excerpt(row.caption, 60)}
                      </Link>
                      {row.headline && (
                        <span className="mt-0.5 block text-[0.8125rem] text-ink-500 dark:text-bone-300">
                          {excerpt(row.caption, 70)}
                        </span>
                      )}
                      {row.hashtags.length > 0 && (
                        <span className="mt-1 block text-[0.75rem] text-gold-700 dark:text-gold-400">
                          {row.hashtags.slice(0, 4).join(" ")}
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="text-[0.875rem] capitalize">{row.platform}</span>
                      <span className="mt-0.5 block text-[0.75rem] text-ink-400 uppercase dark:text-ink-300">
                        {row.language}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      {row.published_at ? (
                        <span className="tnum text-[0.8125rem] text-ink-500 dark:text-bone-300">
                          {formatDateTime(row.published_at, locale)}
                        </span>
                      ) : row.scheduled_for ? (
                        <span className="tnum text-[0.8125rem] text-ink-500 dark:text-bone-300">
                          {formatDateTime(row.scheduled_for, locale)}
                        </span>
                      ) : (
                        <Dash />
                      )}
                    </td>
                    <td>
                      <Badge tone={socialStatusTone(row.status)}>
                        {socialStatusLabel(row.status, dict)}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <ActionLink href={`/social/${row.id}`} tone="secondary" size="sm">
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
              basePath="/social"
              params={{ q: params.q, status: params.status, platform: params.platform }}
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
