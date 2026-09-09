"use server";

import { redirect } from "next/navigation";

import { requireAdminMutation } from "@/lib/admin/auth";
import { bool, localised, str } from "@/lib/admin/forms";
import { contentBlocks, contentGroups, type ContentGroup } from "@/lib/cms/registry";
import { logActivity } from "@/lib/db/repos/activity";
import {
  createFaqItem,
  deleteFaqItem,
  moveFaqItem,
  resetContentBlock,
  setContentBlock,
  updateFaqItem,
} from "@/lib/db/repos/content";
import { asUuid } from "@/lib/db/sql";
import { PUBLIC_TAGS, refreshPublic } from "@/lib/public/tags";

/**
 * Website copy and the FAQ.
 *
 * Saving a group writes every block in it at once, which is what makes the
 * page behave like a form rather than a list of fields each with its own save.
 * A field left empty deletes its override, so the site's original copy comes
 * back — that is the "restore" behaviour, and it is why the empty state is
 * meaningful rather than destructive.
 */

function isGroup(value: string): value is ContentGroup {
  return (contentGroups as string[]).includes(value);
}

export async function saveContentGroupAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const group = str(formData, "group", 20);
  if (!isGroup(group)) redirect("/content?notice=error");

  /* Only the blocks declared for this group, so a crafted POST cannot reach
     the copy on another page. */
  const blocks = contentBlocks.filter((block) => block.group === group);

  for (const block of blocks) {
    await setContentBlock(block.key, localised(formData, `block.${block.key}`, 4000));
  }

  await logActivity({
    kind: "content.updated",
    summary: group,
    entity: "content_block",
  });

  refreshPublic(PUBLIC_TAGS.content);
  redirect(`/content?group=${group}&notice=saved`);
}

export async function resetContentBlockAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const key = str(formData, "key", 120);
  const group = str(formData, "group", 20);

  if (contentBlocks.some((block) => block.key === key)) {
    await resetContentBlock(key);
    refreshPublic(PUBLIC_TAGS.content);
  }

  redirect(isGroup(group) ? `/content?group=${group}&notice=saved` : "/content");
}

// === FAQ ==================================================================

export async function createFaqItemAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const question = localised(formData, "question", 400);
  const answer = localised(formData, "answer", 4000);

  /* Both halves are needed for the entry to be worth publishing. */
  if (Object.keys(question).length === 0 || Object.keys(answer).length === 0) {
    redirect("/content?group=faq&notice=error");
  }

  await createFaqItem({ question, answer, isActive: true });
  refreshPublic(PUBLIC_TAGS.faq);
  redirect("/content?group=faq&notice=saved");
}

export async function updateFaqItemAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (!id) redirect("/content?group=faq");

  await updateFaqItem(id, {
    question: localised(formData, "question", 400),
    answer: localised(formData, "answer", 4000),
    isActive: bool(formData, "isActive"),
  });

  refreshPublic(PUBLIC_TAGS.faq);
  redirect("/content?group=faq&notice=saved");
}

export async function moveFaqItemAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  const direction = str(formData, "direction", 5) === "up" ? "up" : "down";
  if (id) {
    await moveFaqItem(id, direction);
    refreshPublic(PUBLIC_TAGS.faq);
  }
  redirect("/content?group=faq");
}

export async function deleteFaqItemAction(formData: FormData): Promise<void> {
  await requireAdminMutation(formData);

  const id = asUuid(formData.get("id"));
  if (id) {
    await deleteFaqItem(id);
    refreshPublic(PUBLIC_TAGS.faq);
  }
  redirect("/content?group=faq&notice=deleted");
}
