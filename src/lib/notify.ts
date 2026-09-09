import { readSettings } from "@/lib/db/repos/settings";
import { resolveEmailChannel } from "@/lib/delivery";

/**
 * Emails the clinic when something arrives.
 *
 * Two conditions, both required: the notification is switched on in Settings,
 * and an email provider is configured through `RESEND_API_KEY`. Neither is
 * assumed — with the provider missing the dashboard says so on the
 * notifications tab rather than offering a switch that does nothing.
 *
 * Every failure is swallowed and logged. This is called after the message or
 * the appointment is already stored, and an email provider having a bad minute
 * must not lose a patient's enquiry.
 */

export type Notification = {
  kind: "message" | "appointment";
  subject: string;
  /** Body lines; nulls are dropped, so an absent field can be passed through. */
  lines: (string | null)[];
};

export async function notifyAdmin(notification: Notification): Promise<boolean> {
  try {
    const settings = await readSettings();

    const wanted =
      notification.kind === "message"
        ? settings.notifyOnMessage
        : settings.notifyOnAppointment;
    if (!wanted) return false;

    const channel = resolveEmailChannel(process.env);
    if (!channel) return false;

    const to = settings.notifyEmail.trim() || channel.to;
    if (to === "") return false;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: channel.from,
        to: [to],
        subject: notification.subject,
        text: notification.lines.filter((line) => line !== null).join("\n"),
      }),
    });

    if (!response.ok) {
      console.error(`Notification email failed: resend ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Notification email failed:", error);
    return false;
  }
}
