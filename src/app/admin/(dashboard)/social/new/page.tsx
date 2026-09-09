import type { Metadata } from "next";

import { getAdminContext } from "@/admin/locale";
import { Breadcrumbs, PageHeader } from "@/components/admin/Ui";
import { readCsrfToken } from "@/lib/admin/session";

import { createSocialPostAction } from "../actions";
import { SocialPostForm } from "../SocialPostForm";

export const metadata: Metadata = { title: "Postim i re" };

export default async function NewSocialPostPage() {
  const { dict } = await getAdminContext();
  const csrfToken = await readCsrfToken();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: dict.nav.breadcrumbHome, href: "/" },
          { label: dict.social.title, href: "/social" },
          { label: dict.social.createTitle },
        ]}
      />
      <PageHeader title={dict.social.createTitle} />

      <div className="mt-6 max-w-3xl">
        <SocialPostForm
          action={createSocialPostAction}
          csrfToken={csrfToken ?? ""}
          cancelHref="/social"
          labels={{ social: dict.social, common: dict.common, gallery: dict.gallery }}
        />
      </div>
    </>
  );
}
