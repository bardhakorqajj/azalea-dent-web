type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

export function ArrowRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function Phone({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 3h3.5l1.8 4.4-2.2 1.3a12.5 12.5 0 0 0 5.6 5.6l1.3-2.2L19.4 14V17a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 3Z" />
    </svg>
  );
}

export function Mail({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 7.3 5.3a1.5 1.5 0 0 0 1.8 0L20.2 7" />
    </svg>
  );
}

export function MapPin({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function Clock({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  );
}

export function WhatsApp({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8.1 19.4l-4.6 1.1Z" />
      <path d="M9.2 9c.2 1 .7 2 1.4 2.8.8.8 1.7 1.3 2.7 1.6l.9-1.1 2 .9v1.5c-1.6.4-3.6-.4-5.2-2-1.6-1.6-2.4-3.5-2-5.2h1.5l.9 2Z" />
    </svg>
  );
}

export function Instagram({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.6" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Viber({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      {/* Upright rounded bubble with a tail, so it reads apart from WhatsApp's circle. */}
      <path d="M12 3c3.6 0 5.6 2 5.6 5.9 0 3.9-2 5.9-5.6 5.9h-.7l-2.6 2.7v-3.1C7 13.7 6.4 11.9 6.4 8.9 6.4 5 8.4 3 12 3Z" />
      <path d="M10 7.3c.2.8.5 1.4 1 1.9.5.5 1.1.8 1.9 1l.6-.8 1.4.7v1c-1.1.3-2.5-.3-3.6-1.3-1.1-1.1-1.6-2.4-1.3-3.5h1l.6 1Z" />
    </svg>
  );
}

export function Facebook({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.6" />
      <path d="M15.1 8.2h-1.3c-1 0-1.5.6-1.5 1.5v1.4h2.6l-.4 2.6h-2.2v6.7" />
    </svg>
  );
}

export function Menu({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
    </svg>
  );
}

export function Close({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
