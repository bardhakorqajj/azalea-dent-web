import Link from "next/link";

import { setAdminLocaleAction, signOutAction } from "@/app/admin/(dashboard)/actions";
import type { AdminDictionary } from "@/admin/get-dictionary";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

import { IconExternal, IconSearch } from "./Icons";
import { NotificationsMenu, type NotificationItem } from "./NotificationsMenu";
import { SidebarToggle } from "./SidebarToggle";
import { buttonClass } from "./Ui";

/**
 * The bar across the top: the mobile menu button, global search, notifications,
 * the language and theme switches, and the admin's own menu.
 *
 * Search is a GET form pointing at `/search`, so it works before hydration and
 * a result page has a real address.
 */
export function Topbar({
  dict,
  locale,
  csrfToken,
  sidebar,
  notifications,
  unreadCount,
  accountEmail,
  searchQuery,
}: {
  dict: AdminDictionary;
  locale: Locale;
  csrfToken: string;
  /** The same sidebar markup, for the mobile panel. */
  sidebar: React.ReactNode;
  notifications: NotificationItem[];
  unreadCount: number;
  accountEmail: string | null;
  searchQuery?: string;
}) {
  const otherLocale: Locale = locales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <header className="admin-divide sticky top-0 z-30 border-b bg-bone-50/95 backdrop-blur-sm dark:bg-ink-900/95">
      <div className="flex h-[var(--admin-topbar)] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <SidebarToggle openLabel={dict.nav.openMenu} closeLabel={dict.nav.closeMenu}>
          {sidebar}
        </SidebarToggle>

        <form action="/search" method="get" className="min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="admin-search" className="sr-only">
            {dict.common.search}
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-[1.0625rem] w-[1.0625rem] -translate-y-1/2 text-ink-400 dark:text-ink-300" />
            <input
              id="admin-search"
              name="q"
              type="search"
              defaultValue={searchQuery ?? ""}
              placeholder={dict.common.searchPlaceholder}
              className="admin-control min-h-10 pl-10 text-[0.875rem]"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <NotificationsMenu
            labels={dict.notifications}
            items={notifications}
            unreadCount={unreadCount}
            csrfToken={csrfToken}
          />

          {/* Opens the public website, so a change can be checked at once. */}
          <a
            href={siteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title={dict.common.onPublicSite}
            aria-label={dict.common.onPublicSite}
            className={cn(buttonClass("quiet", "sm"), "hidden sm:inline-flex")}
          >
            <IconExternal />
          </a>

          <ThemeToggle labels={dict.theme} />

          {/* One button per switch rather than a select, so it works with no
              JavaScript: the action sets a cookie and the layout re-renders. */}
          <form action={setAdminLocaleAction}>
            <input type="hidden" name="csrf" value={csrfToken} />
            <input type="hidden" name="locale" value={otherLocale} />
            <button
              type="submit"
              title={localeNames[otherLocale]}
              className={cn(
                buttonClass("quiet", "sm"),
                "text-[0.6875rem] font-semibold tracking-[0.1em] uppercase",
              )}
            >
              {otherLocale}
            </button>
          </form>

          <div className="admin-divide ml-1 hidden items-center gap-2 border-l pl-3 sm:flex">
            {accountEmail && (
              <Link
                href="/settings?tab=account"
                className="max-w-[11rem] truncate text-[0.8125rem] text-ink-600 hover:text-ink-900 hover:underline dark:text-bone-300 dark:hover:text-bone-50"
                title={accountEmail}
              >
                {accountEmail}
              </Link>
            )}
            <form action={signOutAction}>
              <input type="hidden" name="csrf" value={csrfToken} />
              <button type="submit" className={buttonClass("secondary", "sm")}>
                {dict.nav.signOut}
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
