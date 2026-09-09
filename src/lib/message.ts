import { isValidEmail, isValidPhone } from "@/lib/appointment";

/**
 * The contact message a visitor can send from the contact page.
 *
 * Kept beside `lib/appointment.ts` and validated the same way, so the two
 * public forms agree about what a valid phone number or email looks like —
 * and so both the browser and the route handler can share these rules rather
 * than each having its own idea.
 */

export type MessageRequest = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  consent: boolean;
};

export const emptyMessage: MessageRequest = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  body: "",
  consent: false,
};

export type MessageField = "name" | "email" | "phone" | "body" | "consent";

/**
 * The reasons a field can be wrong. These are the keys under
 * `dictionary.message.errors`, so a reason added here without its translation
 * is a type error rather than a blank message on the form.
 */
export type MessageErrorKey =
  | "name"
  | "body"
  | "contact"
  | "email"
  | "phone"
  | "consent";

/** Error keys per invalid field, matching `dictionary.message.errors`. */
export function validateMessage(
  request: MessageRequest,
): Partial<Record<MessageField, MessageErrorKey>> {
  const errors: ReturnType<typeof validateMessage> = {};

  if (request.name.trim().length < 2) errors.name = "name";
  if (request.body.trim().length < 5) errors.body = "body";

  const hasEmail = request.email.trim() !== "";
  const hasPhone = request.phone.trim() !== "";

  /* One way to reach them is the point of the form; without either, a reply is
     impossible and the message is a dead end. */
  if (!hasEmail && !hasPhone) {
    errors.email = "contact";
  } else {
    if (hasEmail && !isValidEmail(request.email)) errors.email = "email";
    if (hasPhone && !isValidPhone(request.phone)) errors.phone = "phone";
  }

  if (!request.consent) errors.consent = "consent";

  return errors;
}

export function hasMessageErrors(
  errors: ReturnType<typeof validateMessage>,
): boolean {
  return Object.keys(errors).length > 0;
}
