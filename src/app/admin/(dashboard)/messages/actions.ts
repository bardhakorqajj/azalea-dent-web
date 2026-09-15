"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/auth";
import {
  bool,
  isValidEmail,
  optionalStr,
  str,
  textBlock,
} from "@/lib/admin/forms";
import {
  createMessage,
  deleteMessage,
  markMessageRead,
  updateMessage,
} from "@/lib/db/repos/messages";
import { asUuid } from "@/lib/db/sql";
import { MESSAGE_SOURCES, MESSAGE_STATUSES, oneOf } from "@/lib/db/types";

/** Message mutations. Nothing here is published, so no cache to invalidate. */

export async function updateMessageAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/messages");

  await updateMessage(id, {
    status: oneOf(MESSAGE_STATUSES, formData.get("status")) ?? undefined,
    isRead: formData.has("isRead") ? bool(formData, "isRead") : undefined,
  });

  revalidatePath("/admin", "layout");
  redirect(`/messages/${id}?notice=saved`);
}

export async function markMessageReadAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await markMessageRead(id);
    revalidatePath("/admin", "layout");
  }
  redirect(id ? `/messages/${id}` : "/messages");
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteMessage(id);
    revalidatePath("/admin", "layout");
  }
  redirect("/messages?notice=deleted");
}

/**
 * Records a message that did not come through the website — a phone call, or
 * something that arrived by Instagram — so the inbox is the whole picture
 * rather than only the part the form captured.
 */
export async function createMessageAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const name = str(formData, "name", 160);
  const body = textBlock(formData, "body", 8000);
  const email = str(formData, "email", 160);

  if (name === "" || body === "" || (email !== "" && !isValidEmail(email))) {
    /* The form marks these required; a direct POST without them records
       nothing rather than an empty message. */
    redirect("/messages?notice=error");
  }

  const id = await createMessage({
    name,
    email: email === "" ? null : email,
    phone: optionalStr(formData, "phone", 40),
    subject: optionalStr(formData, "subject", 200),
    body,
    source: oneOf(MESSAGE_SOURCES, str(formData, "source", 20)) ?? "phone",
    locale: null,
  });

  /* Recorded by the clinic, so it has already been read. */
  await markMessageRead(id);

  revalidatePath("/admin", "layout");
  redirect(`/messages/${id}?notice=saved`);
}
