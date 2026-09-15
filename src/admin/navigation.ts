import type { AdminDictionary } from "./get-dictionary";

/**
 * The dashboard's navigation, in one place.
 *
 * Grouped rather than a flat list of fourteen: the clinic's day-to-day work
 * (appointments, patients) is what gets used every morning, the website
 * sections are edited occasionally, and marketing is a separate job again.
 * Sidebar, breadcrumbs and the search palette all read this, so a section
 * cannot appear in one and be missing from another.
 *
 * `href` is the address on the admin host — no /admin prefix, because
 * `proxy.ts` puts it there and takes it off again.
 */

export type AdminNavItem = {
  key: string;
  href: string;
  /** Which dictionary key under `nav` labels it. */
  label: keyof AdminDictionary["nav"];
  icon:
    | "dashboard"
    | "calendar"
    | "patients"
    | "services"
    | "team"
    | "treatments"
    | "social"
    | "content"
    | "promotions"
    | "reviews"
    | "gallery"
    | "messages"
    | "analytics"
    | "settings";
  /** Shows a count beside the label, e.g. unread messages. */
  badge?: "pendingAppointments" | "unreadMessages" | "postsForApproval";
};

export type AdminNavGroup = {
  key: string;
  label: keyof AdminDictionary["nav"] | null;
  items: AdminNavItem[];
};

export const adminNavigation: AdminNavGroup[] = [
  {
    key: "overview",
    label: null,
    items: [{ key: "dashboard", href: "/", label: "dashboard", icon: "dashboard" }],
  },
  {
    key: "clinic",
    label: "groupClinic",
    items: [
      {
        key: "appointments",
        href: "/appointments",
        label: "appointments",
        icon: "calendar",
        badge: "pendingAppointments",
      },
      { key: "patients", href: "/patients", label: "patients", icon: "patients" },
      { key: "treatments", href: "/treatments", label: "treatments", icon: "treatments" },
    ],
  },
  {
    key: "website",
    label: "groupWebsite",
    items: [
      { key: "services", href: "/services", label: "services", icon: "services" },
      { key: "team", href: "/team", label: "team", icon: "team" },
      { key: "content", href: "/content", label: "content", icon: "content" },
      { key: "gallery", href: "/gallery", label: "gallery", icon: "gallery" },
    ],
  },
  {
    key: "marketing",
    label: "groupMarketing",
    items: [
      { key: "promotions", href: "/promotions", label: "promotions", icon: "promotions" },
      { key: "reviews", href: "/reviews", label: "reviews", icon: "reviews" },
      { key: "social", href: "/social", label: "social", icon: "social" },
      {
        key: "messages",
        href: "/messages",
        label: "messages",
        icon: "messages",
        badge: "unreadMessages",
      },
    ],
  },
  {
    key: "system",
    label: "groupSystem",
    items: [
      { key: "analytics", href: "/analytics", label: "analytics", icon: "analytics" },
      { key: "settings", href: "/settings", label: "settings", icon: "settings" },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavigation.flatMap(
  (group) => group.items,
);

/**
 * The item a path belongs to, for marking the sidebar and building
 * breadcrumbs. The longest matching href wins, so `/appointments/new` is
 * "Appointments" rather than the dashboard.
 */
export function activeNavItem(pathname: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;

  for (const item of adminNavItems) {
    if (item.href === "/") {
      if (pathname === "/") best = item;
      continue;
    }
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }

  return best;
}
