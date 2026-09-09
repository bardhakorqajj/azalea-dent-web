import Link from "next/link";

import { adminNavigation, type AdminNavItem } from "@/admin/navigation";
import type { AdminDictionary } from "@/admin/get-dictionary";
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
 * A server component: the active link is decided from the pathname the layout
 * already knows, so navigating does not need any client-side state. The mobile
 * panel wraps this same markup (see `SidebarToggle`), which is why the
 * navigation exists in the page exactly once.
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
  dict,
  pathname,
  counts,
  className,
}: {
  dict: AdminDictionary;
  pathname: string;
  counts: NavCounts;
  className?: string;
}) {
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
            {dict.nav.dashboard}
          </span>
        </span>
      </Link>

      <nav aria-label={dict.nav.dashboard} className="flex-1 overflow-y-auto px-3 pb-6">
        {adminNavigation.map((group) => (
          <div key={group.key} className="mb-1">
            {group.label && (
              <p className="px-3 pt-4 pb-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-ink-400 uppercase dark:text-ink-300">
                {dict.nav[group.label]}
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
                      <span className="min-w-0 flex-1 truncate">{dict.nav[item.label]}</span>
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
