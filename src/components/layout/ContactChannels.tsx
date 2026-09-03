import {
  clinic,
  displayNumber,
  mailtoHref,
  telHref,
  viberHref,
  whatsappHref,
} from "@/content/clinic";
import {
  FacebookBrand,
  InstagramBrand,
  ViberBrand,
  WhatsAppBrand,
} from "@/components/ui/BrandIcons";
import { Mail, Phone } from "@/components/ui/Icons";
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
    .filter((entry): entry is { href: string; value: string } =>
      Boolean(entry.href),
    );

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
      Icon: WhatsAppBrand,
    });
  }
  if (viber) {
    channels.push({
      key: "viber",
      href: viber,
      label: dict.actions.viber,
      value: dict.actions.viber,
      Icon: ViberBrand,
    });
  }

  channels.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: `@${clinic.social.instagram.handle}`,
    Icon: InstagramBrand,
  });

  if (clinic.social.facebook) {
    channels.push({
      key: "facebook",
      href: clinic.social.facebook,
      label: dict.actions.facebook,
      value: dict.actions.facebook,
      Icon: FacebookBrand,
    });
  }

  return channels;
}

type ToneProps = {
  dict: Dictionary;
  tone?: "light" | "dark";
  className?: string;
};

export function ContactChannelList({
  dict,
  tone = "light",
  className,
}: ToneProps) {
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
            isDark
              ? "border-bone-100/12"
              : "border-ink-900/10 dark:border-bone-100/12",
          )}
        >
          <group.Icon
            className={cn(
              "mt-1 h-5 w-5 shrink-0",
              isDark ? "text-gold-400" : "text-gold-700 dark:text-gold-400",
            )}
          />
          <div className="min-w-0">
            <p
              className={cn(
                "eyebrow",
                isDark
                  ? "text-bone-300/60"
                  : "text-ink-500 dark:text-bone-300/60",
              )}
            >
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
                    : "text-ink-900 hover:text-gold-700 dark:text-bone-100 dark:hover:text-gold-300",
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
                : "border-ink-900/20 text-ink-800 hover:border-ink-900 hover:text-ink-900 dark:border-bone-100/25 dark:text-bone-100 dark:hover:border-gold-400 dark:hover:text-gold-300",
            )}
          >
            {/* Brand marks carry their own colour, so no text class here. */}
            <channel.Icon className="h-4 w-4 shrink-0" />
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
export function ChannelIconLinks({
  dict,
  tone = "light",
  className,
}: ToneProps) {
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
      Icon: WhatsAppBrand,
    });
  }
  if (viber) {
    links.push({
      key: "viber",
      href: viber,
      label: dict.actions.viber,
      value: dict.actions.viber,
      Icon: ViberBrand,
    });
  }
  links.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: dict.actions.instagram,
    Icon: InstagramBrand,
  });
  if (clinic.social.facebook) {
    links.push({
      key: "facebook",
      href: clinic.social.facebook,
      label: dict.actions.facebook,
      value: dict.actions.facebook,
      Icon: FacebookBrand,
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
                : "border-ink-900/20 text-ink-800 hover:border-ink-900 hover:text-ink-900 dark:border-bone-100/25 dark:text-bone-100 dark:hover:border-gold-400 dark:hover:text-gold-300",
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

/**
 * Every way a patient can reach the clinic, as one flat list. Used when an
 * appointment request could not be delivered: at that moment the patient
 * should not have to hunt for an alternative, so all of them are offered at
 * once, most immediate first.
 *
 * `summary` pre-fills the channels that can carry it, so nobody retypes what
 * they already filled in. Phone and Viber cannot carry a message body, and
 * Instagram and Facebook are profile links, so those open bare.
 */
export function fallbackChannels(
  dict: Dictionary,
  summary?: string,
): Channel[] {
  const channels: Channel[] = [];

  for (const phone of clinic.phones) {
    const href = telHref(phone);
    if (href) {
      channels.push({
        key: `phone-${phone}`,
        href,
        label: dict.actions.call,
        value: phone,
        Icon: Phone,
      });
    }
  }

  const wa = whatsappHref(summary);
  if (wa) {
    channels.push({
      key: "whatsapp",
      href: wa,
      label: dict.actions.whatsapp,
      value: clinic.whatsapp
        ? displayNumber(clinic.whatsapp)
        : dict.actions.whatsapp,
      Icon: WhatsAppBrand,
    });
  }

  const viber = viberHref();
  if (viber && clinic.viber) {
    channels.push({
      key: "viber",
      href: viber,
      label: dict.actions.viber,
      value: displayNumber(clinic.viber),
      Icon: ViberBrand,
    });
  }

  const mail = mailtoHref({
    subject: dict.appointment.fallback.emailSubject,
    body: summary,
  });
  if (mail && clinic.email) {
    channels.push({
      key: "email",
      href: mail,
      label: dict.actions.email,
      value: clinic.email,
      Icon: Mail,
    });
  }

  channels.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: `@${clinic.social.instagram.handle}`,
    Icon: InstagramBrand,
  });

  if (clinic.social.facebook) {
    channels.push({
      key: "facebook",
      href: clinic.social.facebook,
      label: dict.actions.facebook,
      /* The page URL is a numeric profile id with no readable handle, so the
         clinic's own name is what identifies it. */
      value: clinic.name,
      Icon: FacebookBrand,
    });
  }

  return channels;
}

/** The list above, rendered as tappable rows inside the fallback panel. */
export function FallbackChannels({
  dict,
  summary,
  className,
}: {
  dict: Dictionary;
  summary?: string;
  className?: string;
}) {
  const channels = fallbackChannels(dict, summary);
  if (channels.length === 0) return null;

  return (
    <ul className={cn("grid gap-2.5 sm:grid-cols-2", className)}>
      {channels.map((channel) => (
        <li key={channel.key}>
          <a
            href={channel.href}
            {...(channel.href.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="flex min-h-14 w-full items-center gap-3 rounded-sm border border-ink-900/20 bg-bone-50 px-4 py-2.5 transition-colors hover:border-ink-900 hover:bg-bone-100 dark:border-bone-100/20 dark:bg-ink-900 dark:hover:border-bone-100 dark:hover:bg-ink-800"
          >
            <channel.Icon className="h-5 w-5 shrink-0 text-gold-700 dark:text-gold-400" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[0.7rem] font-medium tracking-[0.14em] text-ink-500 uppercase dark:text-bone-300">
                {channel.label}
              </span>
              <span className="truncate text-[0.92rem] text-ink-900 dark:text-bone-50">
                {channel.value}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
