/**
 * The dashboard's icon set, drawn inline.
 *
 * Inline SVG rather than an icon package: fourteen navigation icons and a
 * handful of controls do not justify a dependency, and these ship as part of
 * the markup with no extra request and no flash of missing glyphs.
 *
 * All of them are 20×20 on a 1.6 stroke, inheriting `currentColor`, so they
 * sit consistently next to 14px labels.
 */

type IconProps = { className?: string };

function Svg({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-[1.125rem] w-[1.125rem] shrink-0"}
    >
      {children}
    </svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </Svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" />
    </Svg>
  );
}

export function IconPatients({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="7.5" cy="6.5" r="3" />
      <path d="M1.75 17c0-2.9 2.57-5 5.75-5s5.75 2.1 5.75 5" />
      <path d="M13.5 4.2a3 3 0 0 1 0 5.6M15 12.4c1.9.5 3.25 1.9 3.25 4.6" />
    </Svg>
  );
}

export function IconServices({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.5c-1.2 0-2 .6-3 .6s-1.6-.6-2.6 0C3.2 3.8 2.8 5.6 3 7.4c.2 1.6.6 2.4.9 4 .3 1.5.3 4.1 1.6 4.1 1.2 0 1.2-2.3 1.6-3.7.3-1 .6-1.6 1.4-1.6s1.1.6 1.4 1.6c.4 1.4.4 3.7 1.6 3.7 1.3 0 1.3-2.6 1.6-4.1.3-1.6.7-2.4.9-4 .2-1.8-.2-3.6-1.4-4.3-1-.6-1.7 0-2.6 0-1 0-1.8-.6-3-.6Z" />
    </Svg>
  );
}

export function IconTeam({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="6" r="3.25" />
      <path d="M4 17.25c0-3.1 2.7-5.25 6-5.25s6 2.15 6 5.25" />
    </Svg>
  );
}

export function IconTreatments({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6.5 2.5v5.25a3.5 3.5 0 0 0 7 0V2.5" />
      <path d="M4.75 2.5h3.5M11.75 2.5h3.5M10 11.25v6.25" />
    </Svg>
  );
}

export function IconSocial({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="5" cy="10" r="2.25" />
      <circle cx="15" cy="5" r="2.25" />
      <circle cx="15" cy="15" r="2.25" />
      <path d="M7 8.9 13 6.1M7 11.1 13 13.9" />
    </Svg>
  );
}

export function IconContent({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="3" width="15" height="14" rx="1.5" />
      <path d="M2.5 7h15M6 10.5h8M6 13.5h5" />
    </Svg>
  );
}

export function IconPromotions({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10.6 2.9 17 9.3a1.5 1.5 0 0 1 0 2.1l-5.6 5.6a1.5 1.5 0 0 1-2.1 0L2.9 10.6a1.5 1.5 0 0 1-.4-1.1l.3-5.3a1.5 1.5 0 0 1 1.4-1.4l5.3-.3a1.5 1.5 0 0 1 1.1.4Z" />
      <circle cx="7" cy="7" r="1.15" />
    </Svg>
  );
}

export function IconReviews({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m10 2.75 2.2 4.6 5 .7-3.6 3.5.86 5-4.46-2.4-4.46 2.4.86-5-3.6-3.5 5-.7Z" />
    </Svg>
  );
}

export function IconGallery({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="1.5" />
      <circle cx="7" cy="8" r="1.4" />
      <path d="m2.9 14.3 4-3.7 3.6 3.3 2.4-2.2 4.2 3.6" />
    </Svg>
  );
}

export function IconMessages({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="m2.9 5.2 7.1 5 7.1-5" />
    </Svg>
  );
}

export function IconAnalytics({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 17V3M3 17h14" />
      <path d="M6.75 17v-5M10.25 17V7.5M13.75 17v-8" />
    </Svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M3.9 6.25l1.75 1M14.35 12.75l1.75 1M3.9 13.75l1.75-1M14.35 7.25l1.75-1" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8.75" cy="8.75" r="5.25" />
      <path d="m12.75 12.75 4 4" />
    </Svg>
  );
}

export function IconBell({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.5-1.5 4.5-1.5 4.5h12s-1.5-1-1.5-4.5A4.5 4.5 0 0 0 10 2.5Z" />
      <path d="M8.25 14.5a1.85 1.85 0 0 0 3.5 0" />
    </Svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </Svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m5 5 10 10M15 5 5 15" />
    </Svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 4v12M4 10h12" />
    </Svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m8 5 5 5-5 5" />
    </Svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 5-5 5 5 5" />
    </Svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3.5 5.5h13M8 5.5V3.75h4V5.5" />
      <path d="M5.25 5.5 6 16.25h8l.75-10.75M8.5 8.5v5M11.5 8.5v5" />
    </Svg>
  );
}

export function IconEdit({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M13.25 3.75l3 3L7.5 15.5l-4 1 1-4Z" />
      <path d="m11.75 5.25 3 3" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m4 10.5 4 4 8-9" />
    </Svg>
  );
}

export function IconExternal({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M11 3.5h5.5V9M16 4 9 11" />
      <path d="M14 11.5v4A1.5 1.5 0 0 1 12.5 17h-8A1.5 1.5 0 0 1 3 15.5v-8A1.5 1.5 0 0 1 4.5 6h4" />
    </Svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 13.5V3.5M6.5 7 10 3.5 13.5 7" />
      <path d="M3.5 12.5v3A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </Svg>
  );
}

export function IconWarning({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.7 3.3 2.3 14.5a1.5 1.5 0 0 0 1.3 2.25h12.8a1.5 1.5 0 0 0 1.3-2.25L11.3 3.3a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M10 7.5v3.75M10 13.9v.1" />
    </Svg>
  );
}

export function IconInfo({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v5M10 6.4v.1" />
    </Svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.75V10l3 2" />
    </Svg>
  );
}
