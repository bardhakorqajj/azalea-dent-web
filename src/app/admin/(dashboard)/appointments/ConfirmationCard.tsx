import { formatDateTime } from "@/admin/format";
import type { AdminDictionary, AdminLocale } from "@/admin/get-dictionary";
import { IconCheck, IconMessages } from "@/components/admin/Icons";
import { Callout, Card, CardBody, CardHeader, buttonClass } from "@/components/admin/Ui";
import { localeNames } from "@/i18n/config";
import type { ConfirmationMessage } from "@/lib/confirmation";
import type { AppointmentConfirmation } from "@/lib/db/repos/appointments";

import { markConfirmationWhatsappAction, sendConfirmationAction } from "./actions";
import { ConfirmationMessageEditor } from "./ConfirmationMessageEditor";

/** The "Send again" form, which the message box posts with once confirmed. */
const SEND_FORM_ID = "send-confirmation-form";

type Channel = "email" | "sms" | "whatsapp";

/** "email and SMS", in the dashboard's language. */
export function channelList(channels: Channel[], t: AdminDictionary["appointments"]["confirmation"]): string {
  const names = channels.map((channel) =>
    channel === "email" ? t.channelEmail : channel === "sms" ? t.channelSms : t.channelWhatsapp,
  );
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")}${t.and}${names[names.length - 1]}`;
}

/**
 * The confirmation panel on an appointment: what the patient will read, what
 * has been sent and how, and the ways to send it.
 *
 * It only ever describes what happened. A message is shown as sent once the
 * email or SMS provider accepted it, or once someone said they sent it on
 * WhatsApp; and when the appointment has moved since, it says the patient was
 * told the old time rather than quietly keeping the green tick.
 */
export function ConfirmationCard({
  appointmentId,
  confirmed,
  csrf,
  message,
  record,
  target,
  auto,
  whatsappBase,
  confirmFormId,
  hasPhone,
  hasEmail,
  dict,
  locale,
}: {
  appointmentId: string;
  confirmed: boolean;
  csrf: string;
  message: ConfirmationMessage;
  record: AppointmentConfirmation;
  /** What a confirmation sent now would name, to compare with the record. */
  target: string;
  auto: { email: boolean; sms: boolean; emailConfigured: boolean; smsConfigured: boolean };
  /** `https://wa.me/<number>`, or null when the number cannot be used. */
  whatsappBase: string | null;
  /** The status card's Confirm form, when confirming can also send. */
  confirmFormId?: string;
  hasPhone: boolean;
  hasEmail: boolean;
  dict: AdminDictionary;
  locale: AdminLocale;
}) {
  const t = dict.appointments.confirmation;
  const autoChannels: Channel[] = [
    ...(auto.email ? (["email"] as const) : []),
    ...(auto.sms ? (["sms"] as const) : []),
  ];

  const sent = record.state === "ready" && record.sentAt !== null;
  /* Only worth saying on a confirmed appointment: on a pending one there is
     nothing to send again until it is confirmed. */
  const moved = confirmed && sent && record.state === "ready" && record.sentFor !== target;

  return (
    <Card>
      <CardHeader title={t.title} />
      <CardBody className="space-y-4">
        {record.state === "unavailable" && <Callout tone="warning">{t.unavailable}</Callout>}

        {record.state === "ready" && confirmed && (
          <p
            className={
              "flex items-start gap-2 text-[0.9375rem] " +
              (sent && !moved ? "text-[#175637] dark:text-[#9fdcbe]" : "text-ink-600 dark:text-bone-300")
            }
          >
            {sent && !moved && <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />}
            {sent && record.sentAt
              ? t.sentOn
                  .replace("{date}", formatDateTime(record.sentAt, locale))
                  .replace("{channels}", channelList(record.channels, t))
              : t.notSent}
          </p>
        )}

        {moved && <Callout tone="warning">{t.movedSince}</Callout>}

        {!confirmed && (
          <p className="text-[0.9375rem] text-ink-600 dark:text-bone-300">{t.onlyWhenConfirmed}</p>
        )}

        <ConfirmationMessageEditor
          initialText={message.body}
          locale={message.locale}
          formId={
            confirmed
              ? autoChannels.length > 0
                ? SEND_FORM_ID
                : undefined
              : confirmFormId
          }
          whatsappBase={confirmed ? whatsappBase : null}
          labels={{
            title: t.preview.replace("{language}", localeNames[message.locale]),
            hint: t.editHint,
            reset: t.resetText,
            openWhatsapp: t.openWhatsapp,
          }}
        />

        {!hasEmail && !hasPhone && <Callout tone="warning">{t.noContact}</Callout>}
        {hasPhone && !whatsappBase && <Callout tone="warning">{t.phoneUnusable}</Callout>}
        {!auto.emailConfigured && !auto.smsConfigured && (hasEmail || hasPhone) && (
          <Callout tone="info">{t.notConfigured}</Callout>
        )}

        {confirmed && (
          <div className="flex flex-wrap gap-2.5">
            {autoChannels.length > 0 && (
              <form id={SEND_FORM_ID} action={sendConfirmationAction}>
                <input type="hidden" name="csrf" value={csrf} />
                <input type="hidden" name="id" value={appointmentId} />
                <button type="submit" className={buttonClass(sent && !moved ? "secondary" : "primary", "sm")}>
                  <IconMessages className="h-4 w-4" />
                  {(sent ? t.sendAgain : t.send).replace("{channels}", channelList(autoChannels, t))}
                </button>
              </form>
            )}

            {whatsappBase && (
              <form action={markConfirmationWhatsappAction}>
                <input type="hidden" name="csrf" value={csrf} />
                <input type="hidden" name="id" value={appointmentId} />
                <button type="submit" className={buttonClass("quiet", "sm")}>
                  <IconCheck className="h-4 w-4" />
                  {t.markWhatsapp}
                </button>
              </form>
            )}
          </div>
        )}

        {confirmed && whatsappBase && (
          <p className="text-[0.8125rem] text-ink-500 dark:text-bone-300">{t.whatsappHint}</p>
        )}
      </CardBody>
    </Card>
  );
}
