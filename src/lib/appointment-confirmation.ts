import { services } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { sq } from "@/i18n/dictionaries/sq";
import {
  buildConfirmation,
  confirmationLocale,
  type ConfirmationMessage,
} from "@/lib/confirmation";
import type { AppointmentWithNames } from "@/lib/db/repos/appointments";
import { readSettings } from "@/lib/db/repos/settings";
import { text } from "@/lib/db/types";

/**
 * The confirmation for one appointment, as the dashboard shows and sends it.
 *
 * The clinic's name, address and phone come from Settings, which already fall
 * back to `content/clinic.ts`, so the message states what the website states.
 */
export async function confirmationForAppointment(
  appointment: AppointmentWithNames,
): Promise<ConfirmationMessage> {
  const settings = await readSettings();
  const locale = confirmationLocale(appointment.locale);

  const town = [settings.addressPostalCode, settings.addressLocality]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const address = [settings.addressStreet.trim(), town].filter(Boolean).join(", ");

  const service = appointment.service_title
    ? text(appointment.service_title, locale)
    : serviceLabelIn(appointment.service_label, locale);

  return buildConfirmation(
    {
      patientName: appointment.patient_name,
      date: appointment.scheduled_date,
      time: appointment.scheduled_time,
      timeSlot: appointment.time_slot,
      service: service?.trim() || null,
      clinicName: settings.clinicName.trim() || "Azalea Dent",
      address: address || null,
      phone: settings.phones[0]?.trim() || null,
    },
    locale,
  );
}

/**
 * A free-text treatment label in the patient's language.
 *
 * Website requests store the treatment's Albanian title, because the clinic
 * reads them in Albanian. A German patient should not be told their treatment
 * in Albanian, so a label that is one of the site's own titles is translated,
 * and "not sure yet" is left out: it is not a treatment to confirm. Anything
 * else is what the clinic typed, and is used as written.
 */
function serviceLabelIn(label: string | null, locale: Locale): string | null {
  const trimmed = label?.trim();
  if (!trimmed || trimmed === sq.appointment.form.serviceOther) return null;
  const shipped = services.find((service) => service.title.sq === trimmed);
  return shipped ? shipped.title[locale] : trimmed;
}

/** What the confirmation names, to notice when the appointment has moved. */
export function confirmationTarget(appointment: {
  scheduled_date: string;
  scheduled_time: string | null;
  time_slot: string | null;
}): string {
  const time = appointment.scheduled_time ?? appointment.time_slot;
  return time ? `${appointment.scheduled_date} ${time}` : appointment.scheduled_date;
}

/** Where replies to the confirmation email should go. */
export async function clinicReplyAddress(): Promise<string | null> {
  const settings = await readSettings();
  return settings.notifyEmail.trim() || settings.email.trim() || null;
}
