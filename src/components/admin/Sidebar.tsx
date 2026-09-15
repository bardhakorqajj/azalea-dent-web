"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation, type AdminNavItem } from "@/admin/navigation";
import type { AdminDictionary } from "@/admin/get-dictionary";

/**
 * Only the navigation labels, not the whole dictionary.
 *
 * This is a client component, so whatever it takes as props is serialised into
 * the page for the browser. Handing it the full dictionary put every string in
 * the dashboard — some 24 kB — into the payload of every single page, to
 * render twenty labels. Narrow props are the fix.
 */
type NavLabels = AdminDictionary["nav"];
import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { clinic } from "@/content/clinic";
import { cn } from "@/lib/utils";

import {
  IconAnalytics,
  IconCalendar,
  IconContent,
  IconDashboard,
  IconGallery,
  IconMessages,
  IconPatients,
  IconPromotions,
  IconReviews,
  IconServices,
  IconSettings,
  IconSocial,
  IconTeam,
  IconTreatments,
} from "./Icons";

/**
 * The sidebar.
 *
 * It reads the pathname itself rather than being handed one. A layout is not
 * re-rendered when navigating between pages inside it, so a path resolved on
 * the server would freeze at whatever page loaded first and the highlight
 * would be wrong for the rest of the session.
 *
 * The `/admin` prefix is stripped before comparing: the dashboard's links are
 * written without it — `proxy.ts` puts it on and takes it off again — so this
 * compares like with like whether the dashboard is reached on its own hostname
 * or, in development, at /admin on localhost.
 */

const icons: Record<AdminNavItem["icon"], (props: { className?: string }) => React.ReactElement> = {
  dashboard: IconDashboard,
  calendar: IconCalendar,
  patients: IconPatients,
  services: IconServices,
  team: IconTeam,
  treatments: IconTreatments,
  social: IconSocial,
  content: IconContent,
  promotions: IconPromotions,
  reviews: IconReviews,
  gallery: IconGallery,
  messages: IconMessages,
  analytics: IconAnalytics,
  settings: IconSettings,
};

export type NavCounts = {
  pendingAppointments: number;
  unreadMessages: number;
  postsForApproval: number;
};

export function Sidebar({
  nav,
  counts,
  className,
}: {
  nav: NavLabels;
  counts: NavCounts;
  className?: string;
}) {
  const raw = usePathname() ?? "/admin";
  const pathname = raw.replace(/^\/admin/, "") || "/";

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 lg:py-6"
        aria-label={clinic.name}
      >
        <AzaleaMark className="h-8 w-8 shrink-0 text-gold-500 dark:text-gold-400" />
        <span className="min-w-0">
          <span className="block truncate font-display text-[1.0625rem] leading-tight text-ink-900 dark:text-bone-50">
            {clinic.name}
          </span>
          <span className="block truncate text-[0.6875rem] font-medium tracking-[0.14em] text-ink-400 uppercase dark:text-ink-300">
            {nav.dashboard}
          </span>
        </span>
      </Link>

      <nav aria-label={nav.dashboard} className="flex-1 overflow-y-auto px-3 pb-6">
        {adminNavigation.map((group) => (
          <div key={group.key} className="mb-1">
            {group.label && (
              <p className="px-3 pt-4 pb-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-ink-400 uppercase dark:text-ink-300">
                {nav[group.label]}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = icons[item.icon];
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const count = item.badge ? counts[item.badge] : 0;

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="admin-nav-link"
                    >
                      <Icon />
                      <span className="min-w-0 flex-1 truncate">{nav[item.label]}</span>
                      {count > 0 && (
                        <span className="tnum ml-auto shrink-0 rounded-full bg-ink-900 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-bone-50 dark:bg-gold-400 dark:text-ink-950">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
