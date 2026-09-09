import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Cache tags shared by the public website's reads and the dashboard's writes.
 *
 * The public pages are cached: they are identical for every visitor and are
 * read far more often than they change. Each cached read is tagged with one of
 * these, and every admin action that changes the underlying table invalidates
 * the matching tag. That pairing is what makes an edit in the dashboard appear
 * on azaleadent.org straight away rather than whenever a timer expires.
 *
 * They live in their own module so both sides import the same constants and a
 * typo cannot quietly break the connection between them.
 */
export const PUBLIC_TAGS = {
  services: "public:services",
  team: "public:team",
  treatments: "public:treatments",
  promotions: "public:promotions",
  reviews: "public:reviews",
  gallery: "public:gallery",
  content: "public:content",
  faq: "public:faq",
  settings: "public:settings",
} as const;

export type PublicTag = (typeof PUBLIC_TAGS)[keyof typeof PUBLIC_TAGS];

/**
 * Invalidates the public site's cache after an admin edit, and refreshes the
 * dashboard's own shell.
 *
 * `{ expire: 0 }` rather than the `"max"` profile the docs recommend, and
 * deliberately so. `"max"` keeps serving the old page for up to a year while
 * a fresh one is built in the background — excellent for a busy product
 * catalogue, wrong here: the clinic owner changes a price, opens the site to
 * check, and sees the old price. With `expire: 0` the next request builds the
 * page before answering, which costs one database read on a site that is
 * edited a few times a week.
 *
 * The tags are attached by `unstable_cache` in `src/lib/public/content.ts`.
 * That API is deprecated in favour of the `use cache` directive, which needs
 * `cacheComponents: true` — a change to how the whole application renders, and
 * not something to fold into this work. The pairing here is the supported
 * route until that migration is made on its own.
 */
export function refreshPublic(...tags: PublicTag[]): void {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  /* The dashboard's shell carries the sidebar counts and the notifications, so
     it is re-rendered too. */
  revalidatePath("/admin", "layout");
}
