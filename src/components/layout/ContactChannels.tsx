import {
  clinic,
  mailtoHref,
  telHref,
  viberHref,
  whatsappHref,
} from "@/content/clinic";
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  Viber,
  WhatsApp,
} from "@/components/ui/Icons";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type IconComponent = (props: { className?: string }) => React.ReactElement;

type Channel = {
  key: string;
  href: string;
  label: string;
  value: string;
  Icon: IconComponent;
};

/** One label with one or more links under it — the clinic has two phone lines. */
type ChannelGroup = {
  key: string;
  label: string;
  Icon: IconComponent;
  items: { href: string; value: string }[];
};

/**
 * The details a patient reads: the published phone numbers and the email
 * address. Anything not configured in `content/clinic.ts` is simply absent —
 * the site never renders a placeholder number.
 */
export function contactChannels(dict: Dictionary): ChannelGroup[] {
  const groups: ChannelGroup[] = [];

  const phones = clinic.phones
    .map((phone) => ({ href: telHref(phone), value: phone }))
    .filter((entry): entry is { href: string; value: string } => Boolean(entry.href));

  if (phones.length > 0) {
    groups.push({
      key: "phone",
      label: dict.actions.call,
      Icon: Phone,
      items: phones,
    });
  }

  const mail = mailtoHref();
  if (mail && clinic.email) {
    groups.push({
      key: "email",
      label: dict.actions.email,
      Icon: Mail,
      items: [{ href: mail, value: clinic.email }],
    });
  }

  return groups;
}

/**
 * The channels a patient taps: messaging apps and social profiles. Separating
 * them from the read-only details keeps the contact block from becoming a wall
 * of near-identical rows, since WhatsApp and Viber repeat the same number.
 */
export function messagingChannels(dict: Dictionary): Channel[] {
  const channels: Channel[] = [];
  const wa = whatsappHref();
  const viber = viberHref();

  if (wa) {
    channels.push({
      key: "whatsapp",
      href: wa,
      label: dict.actions.whatsapp,
      value: dict.actions.whatsapp,
      Icon: WhatsApp,
    });
  }
  if (viber) {
    channels.push({
      key: "viber",
      href: viber,
      label: dict.actions.viber,
      value: dict.actions.viber,
      Icon: Viber,
    });
  }

  channels.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: `@${clinic.social.instagram.handle}`,
    Icon: Instagram,
  });

  if (clinic.social.facebook) {
    channels.push({
      key: "facebook",
      href: clinic.social.facebook,
      label: dict.actions.facebook,
      value: dict.actions.facebook,
      Icon: Facebook,
    });
  }

  return channels;
}

type ToneProps = {
  dict: Dictionary;
  tone?: "light" | "dark";
  className?: string;
};

export function ContactChannelList({ dict, tone = "light", className }: ToneProps) {
  const groups = contactChannels(dict);
  if (groups.length === 0) return null;
  const isDark = tone === "dark";

  return (
    <ul className={cn("flex flex-col", className)}>
      {groups.map((group) => (
        <li
          key={group.key}
          className={cn(
            "flex gap-4 border-b py-4",
            isDark ? "border-bone-100/12" : "border-ink-900/10",
          )}
        >
          <group.Icon
            className={cn(
              "mt-1 h-5 w-5 shrink-0",
              isDark ? "text-gold-400" : "text-gold-700",
            )}
          />
          <div className="min-w-0">
            <p className={cn("eyebrow", isDark ? "text-bone-300/60" : "text-ink-500")}>
              {group.label}
            </p>
            {group.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "mt-1 block min-h-8 text-[0.98rem] transition-colors",
                  isDark
                    ? "text-bone-100 hover:text-gold-300"
                    : "text-ink-900 hover:text-gold-700",
                )}
              >
                {item.value}
              </a>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** WhatsApp, Viber, Instagram and Facebook as compact tappable chips. */
export function MessagingLinks({ dict, tone = "light", className }: ToneProps) {
  const channels = messagingChannels(dict);
  if (channels.length === 0) return null;
  const isDark = tone === "dark";

  return (
    /* An even grid, so every channel button is exactly the same size
       whatever the length of its name. */
    <ul className={cn("grid max-w-xs grid-cols-2 gap-2.5", className)}>
      {channels.map((channel) => (
        <li key={channel.key}>
          <a
            href={channel.href}
            {...(channel.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-sm border px-3 text-[0.78rem] transition-colors",
              isDark
                ? "border-bone-100/25 text-bone-100 hover:border-gold-400 hover:text-gold-300"
                : "border-ink-900/20 text-ink-800 hover:border-ink-900 hover:text-ink-900",
            )}
          >
            <channel.Icon
              className={cn("h-4 w-4 shrink-0", isDark ? "text-gold-400" : "text-gold-700")}
            />
            {channel.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Every direct channel as square icon buttons, sized to match a primary
 * button so they sit on the same line beside it without taking the space a
 * row of labelled buttons would.
 */
export function ChannelIconLinks({ dict, tone = "light", className }: ToneProps) {
  const links: Channel[] = [];
  const tel = telHref();
  const wa = whatsappHref();
  const viber = viberHref();

  if (tel && clinic.phones[0]) {
    links.push({
      key: "phone",
      href: tel,
      label: dict.actions.call,
      value: clinic.phones[0],
      Icon: Phone,
    });
  }
  if (wa) {
    links.push({
      key: "whatsapp",
      href: wa,
      label: dict.actions.whatsapp,
      value: dict.actions.whatsapp,
      Icon: WhatsApp,
    });
  }
  if (viber) {
    links.push({
      key: "viber",
      href: viber,
      label: dict.actions.viber,
      value: dict.actions.viber,
      Icon: Viber,
    });
  }
  links.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: dict.actions.instagram,
    Icon: Instagram,
  });
  if (clinic.social.facebook) {
    links.push({
      key: "facebook",
      href: clinic.social.facebook,
      label: dict.actions.facebook,
      value: dict.actions.facebook,
      Icon: Facebook,
    });
  }

  const isDark = tone === "dark";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link) => (
        <li key={link.key}>
          <a
            href={link.href}
            {...(link.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            title={link.label}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-sm border transition-colors",
              isDark
                ? "border-bone-100/25 text-bone-100 hover:border-gold-400 hover:text-gold-300"
                : "border-ink-900/20 text-ink-800 hover:border-ink-900 hover:text-ink-900",
            )}
          >
            <span className="sr-only">{link.label}</span>
            <link.Icon className="h-5 w-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
