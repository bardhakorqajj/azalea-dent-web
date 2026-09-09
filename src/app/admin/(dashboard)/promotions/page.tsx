import type { Metadata } from "next";
import Link from "next/link";

import { formatDateShort } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconPromotions,
} from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Card,
  Dash,
  EmptyState,
  PageHeader,
  TableWrap,
  buttonClass,
  type BadgeTone,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { listPromotions, promotionState, type PromotionState } from "@/lib/db/repos/promotions";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";

import { movePromotionAction, togglePromotionActiveAction } from "./actions";

export const metadata: Metadata = { title: "Promocionet" };

export default async function PromotionsPage() {
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.promotions.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const [rows, csrfToken] = await Promise.all([listPromotions(), readCsrfToken()]);
  const csrf = csrfToken ?? "";

  const stateLabels: Record<PromotionState, string> = {
    live: dict.promotions.live,
    scheduled: dict.promotions.scheduled,
    expired: dict.promotions.expired,
    draft: dict.promotions.draft,
  };

  const stateTones: Record<PromotionState, BadgeTone> = {
    live: "positive",
    scheduled: "info",
    expired: "neutral",
    draft: "warning",
  };

  return (
    <>
      <PageHeader
        title={dict.promotions.title}
        description={dict.promotions.subtitle}
        actions={
          <ActionLink href="/promotions/new" tone="primary">
            <IconPlus className="h-4 w-4" />
            {dict.promotions.create}
          </ActionLink>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.promotions.savedNotice,
          deleted: dict.promotions.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Card className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            title={dict.promotions.empty}
            hint={dict.promotions.emptyHint}
            icon={<IconPromotions />}
            action={
              <ActionLink href="/promotions/new" tone="primary" size="sm">
                {dict.promotions.create}
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
                <th scope="col">{dict.common.title}</th>
                <th scope="col" className="hidden md:table-cell">
                  {dict.promotions.discountText}
                </th>
                <th scope="col" className="hidden sm:table-cell">
                  {dict.common.date}
                </th>
                <th scope="col">{dict.common.status}</th>
                <th scope="col" className="text-right">
                  {dict.common.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const state = promotionState(row);

                return (
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
                        href={`/promotions/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {text(row.title, locale) || row.slug}
                      </Link>
                    </td>
                    <td className="hidden md:table-cell">
                      {text(row.discount_text, locale) || <Dash />}
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="tnum text-[0.8125rem] text-ink-500 dark:text-bone-300">
                        {row.starts_on ? formatDateShort(row.starts_on, locale) : "…"}
                        {" – "}
                        {row.ends_on ? formatDateShort(row.ends_on, locale) : "…"}
                      </span>
                    </td>
                    <td>
                      <Badge tone={stateTones[state]}>{stateLabels[state]}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={togglePromotionActiveAction}>
                          <input type="hidden" name="csrf" value={csrf} />
                          <input type="hidden" name="id" value={row.id} />
                          <input
                            type="hidden"
                            name="label"
                            value={text(row.title, locale)}
                          />
                          <button type="submit" className={buttonClass("quiet", "sm")}>
                            {row.is_active
                              ? dict.promotions.deactivate
                              : dict.promotions.activate}
                          </button>
                        </form>
                        <ActionLink
                          href={`/promotions/${row.id}`}
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
    <form action={movePromotionAction}>
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
