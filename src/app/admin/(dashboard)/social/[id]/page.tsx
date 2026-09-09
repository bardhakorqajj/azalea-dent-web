import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { excerpt, socialStatusLabel, socialStatusTone } from "@/admin/format";
import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { IconCheck, IconTrash } from "@/components/admin/Icons";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  buttonClass,
} from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";
import { getSocialPost } from "@/lib/db/repos/social";
import { asUuid } from "@/lib/db/sql";
import type { SocialStatus } from "@/lib/db/types";

import {
  deleteSocialPostAction,
  setSocialStatusAction,
  updateSocialPostAction,
} from "../actions";
import { SocialPostForm } from "../SocialPostForm";

export const metadata: Metadata = { title: "Postimi" };

export default async function EditSocialPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = asUuid(raw);
  if (!id) notFound();

  const { dict } = await getAdminContext();
  const [post, csrfToken] = await Promise.all([getSocialPost(id), readCsrfToken()]);
  if (!post) notFound();

  const csrf = csrfToken ?? "";
  const label = post.headline ?? excerpt(post.caption, 50);

  /* Which step comes next, given where the post is now. Only the moves that
     make sense are offered. */
  const nextSteps: { status: SocialStatus; label: string; primary?: boolean }[] = [];
  if (post.status === "draft") {
    nextSteps.push({ status: "ready_for_approval", label: dict.social.sendForApproval, primary: true });
  }
  if (post.status === "ready_for_approval") {
    nextSteps.push({ status: "approved", label: dict.social.approve, primary: true });
    nextSteps.push({ status: "draft", label: dict.social.statusDraft });
  }
  if (post.status === "approved") {
    nextSteps.push({ status: "published", label: dict.social.markPublished, primary: true });
    nextSteps.push({ status: "ready_for_approval", label: dict.social.unapprove });
  }
  if (post.status === "scheduled") {
    nextSteps.push({ status: "published", label: dict.social.markPublished, primary: true });
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.social.title, href: "/social" },
          { label },
        ]}
      />

      <PageHeader
        title={label}
        description={dict.social.editTitle}
        actions={
          <Badge tone={socialStatusTone(post.status)}>
            {socialStatusLabel(post.status, dict)}
          </Badge>
        }
      />

      <Toast
        closeLabel={dict.common.close}
        messages={{ saved: dict.social.savedNotice, error: dict.errors.body }}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SocialPostForm
            action={updateSocialPostAction}
            csrfToken={csrf}
            post={post}
            cancelHref="/social"
            labels={{ social: dict.social, common: dict.common, gallery: dict.gallery }}
            deleteSlot={
              <ConfirmSubmit
                formAction={deleteSocialPostAction}
                label={dict.common.delete}
                title={dict.social.deleteConfirm}
                confirmLabel={dict.common.delete}
                cancelLabel={dict.common.cancel}
                icon={<IconTrash className="h-4 w-4" />}
              />
            }
          />
        </div>

        {nextSteps.length > 0 && (
          <div>
            <Card>
              <CardHeader
                title={dict.common.status}
                hint={
                  post.status === "approved" || post.status === "scheduled"
                    ? dict.social.markPublishedHint
                    : undefined
                }
              />
              <CardBody className="space-y-2.5">
                {nextSteps.map((step) => (
                  <form key={step.status} action={setSocialStatusAction}>
                    <input type="hidden" name="csrf" value={csrf} />
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="status" value={step.status} />
                    <input type="hidden" name="label" value={label} />
                    <button
                      type="submit"
                      className={buttonClass(
                        step.primary ? "primary" : "secondary",
                        "sm",
                        "w-full",
                      )}
                    >
                      {step.primary && <IconCheck className="h-4 w-4" />}
                      {step.label}
                    </button>
                  </form>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
