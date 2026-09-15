import type { Metadata } from "next";
import Link from "next/link";

import { getAdminContext } from "@/admin/locale";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { CheckboxField, LocalisedField } from "@/components/admin/Fields";
import {
  IconChevronLeft,
  IconChevronRight,
  IconContent,
  IconPlus,
} from "@/components/admin/Icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Toast } from "@/components/admin/Toast";
import {
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  buttonClass,
} from "@/components/admin/Ui";
import { localeNames, locales } from "@/i18n/config";
import { readCsrfToken } from "@/lib/admin/session";
import { blocksInGroup, contentGroups, type ContentGroup } from "@/lib/cms/registry";
import { contentOverrides, listFaqItems } from "@/lib/db/repos/content";
import { databaseReady } from "@/lib/db/status";
import { text } from "@/lib/db/types";

import {
  createFaqItemAction,
  deleteFaqItemAction,
  moveFaqItemAction,
  resetContentBlockAction,
  saveContentGroupAction,
  updateFaqItemAction,
} from "./actions";

export const metadata: Metadata = { title: "Përmbajtja e faqes" };

/**
 * Editable website copy, grouped by the page it appears on, plus the FAQ.
 *
 * Every field shows the site's original text as its placeholder, and clearing
 * a field restores it. That is the safety property of the whole CMS: nothing
 * the clinic does here can leave the public site with an empty heading.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { dict, locale } = await getAdminContext();

  if (!(await databaseReady())) {
    return (
      <>
        <PageHeader title={dict.content.title} />
        <Card className="mt-6">
          <EmptyState
            title={dict.errors.databaseMissing}
            hint={dict.errors.databaseMissingBody}
          />
        </Card>
      </>
    );
  }

  const groupLabels: Record<ContentGroup | "faq", string> = {
    home: dict.content.groupHome,
    about: dict.content.groupAbout,
    contact: dict.content.groupContact,
    footer: dict.content.groupFooter,
    faq: dict.content.groupFaq,
  };

  const requested = params.group ?? "home";
  const tab: ContentGroup | "faq" =
    requested === "faq" || (contentGroups as string[]).includes(requested)
      ? (requested as ContentGroup | "faq")
      : "home";

  const [overrides, faqItems, csrfToken] = await Promise.all([
    contentOverrides(),
    tab === "faq" ? listFaqItems() : Promise.resolve([]),
    readCsrfToken(),
  ]);

  const csrf = csrfToken ?? "";

  return (
    <>
      <PageHeader title={dict.content.title} description={dict.content.subtitle} />

      <Toast
        closeLabel={dict.common.close}
        messages={{
          saved: dict.content.savedNotice,
          deleted: dict.content.savedNotice,
          error: dict.errors.body,
        }}
      />

      <Callout tone="info" className="mt-5">
        {dict.content.hint}
      </Callout>

      {/* Tabs as links, so each group has its own address. */}
      <nav className="admin-divide mt-6 flex flex-wrap gap-1 border-b pb-px">
        {([...contentGroups, "faq"] as const).map((group) => (
          <Link
            key={group}
            href={`/content?group=${group}`}
            aria-current={tab === group ? "page" : undefined}
            className={
              "rounded-t-sm px-4 py-2 text-[0.875rem] font-medium transition-colors " +
              (tab === group
                ? "border-b-2 border-ink-900 text-ink-900 dark:border-gold-400 dark:text-bone-50"
                : "text-ink-500 hover:text-ink-900 dark:text-bone-300 dark:hover:text-bone-50")
            }
          >
            {groupLabels[group]}
          </Link>
        ))}
      </nav>

      {tab === "faq" ? (
        <div className="mt-6 max-w-3xl space-y-6">
          {faqItems.length === 0 ? (
            <Card>
              <EmptyState title={dict.content.faqEmpty} icon={<IconContent />} />
            </Card>
          ) : (
            faqItems.map((item, index) => (
              <Card key={item.id}>
                <CardHeader
                  title={text(item.question, locale) || dict.content.faqQuestion}
                  actions={
                    <div className="flex items-center gap-1.5">
                      <Badge tone={item.is_active ? "positive" : "neutral"}>
                        {item.is_active ? dict.common.active : dict.common.inactive}
                      </Badge>
                      <FaqMove
                        id={item.id}
                        csrf={csrf}
                        direction="up"
                        label={dict.common.moveUp}
                        disabled={index === 0}
                      />
                      <FaqMove
                        id={item.id}
                        csrf={csrf}
                        direction="down"
                        label={dict.common.moveDown}
                        disabled={index === faqItems.length - 1}
                      />
                    </div>
                  }
                />
                <CardBody>
                  <form action={updateFaqItemAction} className="space-y-5">
                    <input type="hidden" name="csrf" value={csrf} />
                    <input type="hidden" name="id" value={item.id} />

                    <LocalisedField
                      name="question"
                      label={dict.content.faqQuestion}
                      value={item.question}
                      localeLabels={localeNames}
                    />
                    <LocalisedField
                      name="answer"
                      label={dict.content.faqAnswer}
                      value={item.answer}
                      localeLabels={localeNames}
                      multiline
                      rows={3}
                    />
                    <CheckboxField
                      name="isActive"
                      label={dict.common.active}
                      defaultChecked={item.is_active}
                    />

                    <div className="flex items-center gap-3">
                      <SubmitButton pendingLabel={dict.common.saving} size="sm">
                        {dict.common.save}
                      </SubmitButton>
                      <div className="ml-auto">
                        <ConfirmSubmit
                          formAction={deleteFaqItemAction}
                          label={dict.common.delete}
                          title={dict.common.delete}
                          confirmLabel={dict.common.delete}
                          cancelLabel={dict.common.cancel}
                        />
                      </div>
                    </div>
                  </form>
                </CardBody>
              </Card>
            ))
          )}

          <Card>
            <CardHeader title={dict.content.faqCreate} />
            <CardBody>
              <form action={createFaqItemAction} className="space-y-5">
                <input type="hidden" name="csrf" value={csrf} />
                <LocalisedField
                  name="question"
                  label={dict.content.faqQuestion}
                  localeLabels={localeNames}
                />
                <LocalisedField
                  name="answer"
                  label={dict.content.faqAnswer}
                  localeLabels={localeNames}
                  multiline
                  rows={3}
                />
                <SubmitButton pendingLabel={dict.common.saving} tone="secondary">
                  <IconPlus className="h-4 w-4" />
                  {dict.content.faqCreate}
                </SubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="mt-6 max-w-3xl">
          <form action={saveContentGroupAction} className="space-y-6">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="group" value={tab} />

            {blocksInGroup(tab).map((block) => {
              const override = overrides.get(block.key);
              const edited = override !== undefined;

              return (
                <Card key={block.key}>
                  <CardHeader
                    title={text(block.label, locale)}
                    actions={
                      edited ? (
                        <Badge tone="gold">{dict.content.edited}</Badge>
                      ) : (
                        <span className="text-[0.75rem] text-ink-400 dark:text-ink-300">
                          {dict.content.usingDefault}
                        </span>
                      )
                    }
                  />
                  <CardBody className="space-y-3">
                    {/* Each language's own field, prefilled with the override
                        and placeholder-ed with the site's original copy — so
                        it is always clear what clearing the field restores. */}
                    <div
                      className={
                        block.kind === "textarea"
                          ? "grid gap-3 lg:grid-cols-2"
                          : "grid gap-3 sm:grid-cols-2"
                      }
                    >
                      {locales.map((candidate) => {
                        const name = `block.${block.key}.${candidate}`;
                        return (
                          <div key={candidate}>
                            <label
                              htmlFor={name}
                              className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.09em] text-ink-500 uppercase dark:text-ink-300"
                            >
                              {localeNames[candidate]}
                            </label>
                            {block.kind === "textarea" ? (
                              <textarea
                                id={name}
                                name={name}
                                rows={3}
                                defaultValue={override?.[candidate] ?? ""}
                                placeholder={block.fallback[candidate] ?? ""}
                                className="admin-control resize-y leading-relaxed"
                              />
                            ) : (
                              <input
                                id={name}
                                name={name}
                                type="text"
                                defaultValue={override?.[candidate] ?? ""}
                                placeholder={block.fallback[candidate] ?? ""}
                                className="admin-control"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {edited && (
                      <div className="flex justify-end">
                        <ConfirmSubmit
                          formAction={resetContentBlockAction}
                          name="key"
                          value={block.key}
                          label={dict.content.resetToDefault}
                          title={dict.content.resetConfirm}
                          confirmLabel={dict.content.resetToDefault}
                          cancelLabel={dict.common.cancel}
                          tone="quiet"
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}

            <SubmitButton pendingLabel={dict.common.saving}>
              {dict.common.saveChanges}
            </SubmitButton>
          </form>
        </div>
      )}
    </>
  );
}

function FaqMove({
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
    <form action={moveFaqItemAction}>
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
