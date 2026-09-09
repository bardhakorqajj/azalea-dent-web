import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  formatDateTime,
  messageSourceLabel,
  messageStatusLabel,
  messageStatusTone,
} from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconExternal, IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  ActionLink,
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  Dash,
  FieldValue,
  PageHeader,
  buttonClass,
} from "@/components/admin/Ui";
import { telHref } from "@/content/clinic";
import { readCsrfToken } from "@/lib/admin/session";
import { getMessage, markMessageRead } from "@/lib/db/repos/messages";
import { asUuid } from "@/lib/db/sql";
import { MESSAGE_STATUSES } from "@/lib/db/types";

import { deleteMessageAction, updateMessageAction } from "../actions";

export const metadata: Metadata = { title: "Mesazhi" };

/**
 * One message.
 *
 * Opening it marks it read — which is a write during a page render, and
 * deliberate: the alternative is a "mark as read" button the owner has to
 * remember to press, and an unread count that never goes down.
 */
export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict, locale } = await getAdminContext();
  const [message, csrfToken] = await Promise.all([getMessage(id), readCsrfToken()]);
  if (!message) notFound();

  if (!message.is_read) await markMessageRead(id);

  const csrf = csrfToken ?? "";
  const phoneLink = message.phone ? telHref(message.phone) : null;
  const replyLink = message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent(
        message.subject ? `Re: ${message.subject}` : "Azalea Dent",
      )}`
    : null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.messages.title, href: "/messages" },
          { label: message.name },
        ]}
      />

      <PageHeader
        title={message.subject ?? message.name}
        description={formatDateTime(message.created_at, locale)}
        actions={
          <Badge tone={messageStatusTone(message.status)}>
            {messageStatusLabel(message.status, dict)}
          </Badge>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.messages.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title={dict.messages.message} />
            <CardBody>
              <p className="whitespace-pre-line leading-relaxed text-ink-800 dark:text-bone-100">
                {message.body}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={dict.common.name} />
            <CardBody>
              <dl className="space-y-4">
                <FieldValue label={dict.common.name}>{message.name}</FieldValue>
                <FieldValue label={dict.common.email}>
                  {message.email ? (
                    <a href={replyLink ?? "#"} className="break-all hover:underline">
                      {message.email}
                    </a>
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.common.phone}>
                  {phoneLink ? (
                    <a href={phoneLink} className="hover:underline">
                      {message.phone}
                    </a>
                  ) : (
                    <Dash />
                  )}
                </FieldValue>
                <FieldValue label={dict.messages.source}>
                  {messageSourceLabel(message.source, dict)}
                  {message.locale && (
                    <span className="ml-2 text-[0.75rem] text-ink-400 uppercase dark:text-ink-300">
                      {message.locale}
                    </span>
                  )}
                </FieldValue>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                {replyLink && (
                  <ActionLink href={replyLink} tone="primary" size="sm" external>
                    <IconExternal className="h-4 w-4" />
                    {dict.messages.reply}
                  </ActionLink>
                )}
                {phoneLink && (
                  <ActionLink href={phoneLink} tone="secondary" size="sm" external>
                    {dict.messages.callBack}
                  </ActionLink>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={dict.common.status} />
            <CardBody className="space-y-2.5">
              {MESSAGE_STATUSES.filter((status) => status !== message.status).map(
                (status) => (
                  <form key={status} action={updateMessageAction}>
                    <input type="hidden" name="csrf" value={csrf} />
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value={status} />
                    <button
                      type="submit"
                      className={buttonClass(
                        status === "spam" ? "quiet" : "secondary",
                        "sm",
                        "w-full",
                      )}
                    >
                      {messageStatusLabel(status, dict)}
                    </button>
                  </form>
                ),
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <form action={deleteMessageAction}>
                <input type="hidden" name="csrf" value={csrf} />
                <input type="hidden" name="id" value={message.id} />
                <ConfirmSubmit
                  label={dict.common.delete}
                  title={dict.messages.deleteConfirm}
                  confirmLabel={dict.common.delete}
                  cancelLabel={dict.common.cancel}
                  icon={<IconTrash className="h-4 w-4" />}
                  className="w-full"
                />
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
