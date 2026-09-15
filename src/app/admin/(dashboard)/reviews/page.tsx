import type { Metadata } from "next";
import Link from "next/link";

import { formatDateShort, ratingStars, reviewSourceLabel } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconReviews,
} from "@/components/admin/Icons";
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
  buttonClass,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { listReviews, reviewStats } from "@/lib/db/repos/reviews";
import { databaseReady } from "@/lib/db/status";
import { excerpt } from "@/admin/format";
import { text } from "@/lib/db/types";

import { moveReviewAction, toggleReviewPublishedAction } from "./actions";

export const metadata: Metadata = { title: "Vlerësimet" };

export default async function ReviewsPage() {
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.reviews.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [rows, stats, csrfToken] = await Promise.all([
    listReviews(),
    reviewStats(),
    readCsrfToken(),
  ]);
  const csrf = csrfToken ?? "";

  return (
    <>
      <PageHeader
        title={dict.reviews.title}
        description={
          stats.total > 0
            ? `${stats.published}/${stats.total} ${dict.common.published.toLowerCase()}` +
              (stats.averageRating !== null ? ` · ${stats.averageRating} ★` : "")
            : dict.reviews.subtitle
        }
        actions={
          <ActionLink href="/reviews/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.reviews.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.reviews.savedNotice,
          deleted: dict.reviews.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Callout tone="info" className="mt-5">
        {dict.reviews.honestyNotice}
      </Callout>

      <Card className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title={dict.reviews.empty}
            hint={dict.reviews.emptyHint}
            icon={<IconReviews />}
            action={
              <ActionLink href="/reviews/new" tone="primary" size="sm">
                {dict.reviews.create}
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
                <th scope="col">{dict.reviews.authorName}</th>
                <th scope="col" className="hidden md:table-cell">
                  {dict.reviews.reviewBody}
                </th>
                <th scope="col">{dict.reviews.rating}</th>
                <th scope="col" className="hidden sm:table-cell">
                  {dict.reviews.source}
                </th>
                <th scope="col">{dict.common.status}</th>
                <th scope="col" className="text-right">
                  {dict.common.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex gap-1">
                      <MoveButton
                        id={row.id}
                        csrf={csrf}
                        direction="up"
                        label={dict.common.moveUp}
                        disabled={index === 0}
                      />
                      <MoveButton
                        id={row.id}
                        csrf={csrf}
                        direction="down"
                        label={dict.common.moveDown}
                        disabled={index === rows.length - 1}
                      />
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/reviews/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.author_name}
                    </Link>
                    {row.reviewed_on && (
                      <span className="tnum mt-0.5 block text-[0.75rem] text-ink-400 dark:text-ink-300">
                        {formatDateShort(row.reviewed_on, locale)}
                      </span>
                    )}
                  </td>
                  <td className="hidden max-w-sm md:table-cell">
                    <span className="text-[0.875rem] text-ink-600 dark:text-bone-200">
                      {excerpt(text(row.body, locale), 90)}
                    </span>
                  </td>
                  <td>
                    {row.rating !== null ? (
                      <span
                        title={`${row.rating}/5`}
                        className="text-gold-500 dark:text-gold-400"
                      >
                        {ratingStars(row.rating)}
                      </span>
                    ) : (
                      <Dash />
                    )}
                  </td>
                  <td className="hidden sm:table-cell">
                    {/* Where it came from, on every row: the difference
                        between a hand-entered testimonial and a verified
                        Google review is not something to bury. */}
                    <Badge tone={row.source === "manual" ? "neutral" : "info"}>
                      {reviewSourceLabel(row.source, dict)}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={row.is_published ? "positive" : "neutral"}>
                      {row.is_published ? dict.common.published : dict.common.unpublished}
                    </Badge>
                    {row.is_featured && (
                      <span className="ml-1.5">
                        <Badge tone="gold">{dict.common.featured}</Badge>
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <form action={toggleReviewPublishedAction}>
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="label" value={row.author_name} />
                        <button type="submit" className={buttonClass("quiet", "sm")}>
                          {row.is_published ? dict.reviews.unpublish : dict.reviews.publish}
                        </button>
                      </form>
                      <ActionLink href={`/reviews/${row.id}`} tone="secondary" size="sm">
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
    <form action={moveReviewAction}>
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
