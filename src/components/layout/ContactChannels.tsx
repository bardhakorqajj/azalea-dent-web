import { clinic, mailtoHref, telHref, whatsappHref } from "@/content/clinic";
import { Instagram, Mail, Phone, WhatsApp } from "@/components/ui/Icons";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type Channel = {
  key: string;
  href: string;
  label: string;
  value: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  external: boolean;
};

/**
 * The contact channels that are actually configured. Channels whose details are
 * unknown are simply absent — the site never renders a placeholder phone number.
 */
export function contactChannels(dict: Dictionary): Channel[] {
  const channels: Channel[] = [];
  const tel = telHref();
  const wa = whatsappHref();
  const mail = mailtoHref();

  if (tel && clinic.phone) {
    channels.push({
      key: "phone",
      href: tel,
      label: dict.actions.call,
      value: clinic.phone,
      Icon: Phone,
      external: false,
    });
  }
  if (wa && clinic.whatsapp) {
    channels.push({
      key: "whatsapp",
      href: wa,
      label: dict.actions.whatsapp,
      value: clinic.phone ?? dict.actions.whatsapp,
      Icon: WhatsApp,
      external: true,
    });
  }
  if (mail && clinic.email) {
    channels.push({
      key: "email",
      href: mail,
      label: dict.actions.email,
      value: clinic.email,
      Icon: Mail,
      external: false,
    });
  }

  channels.push({
    key: "instagram",
    href: clinic.social.instagram.url,
    label: dict.actions.instagram,
    value: `@${clinic.social.instagram.handle}`,
    Icon: Instagram,
    external: true,
  });

  return channels;
}

type ContactChannelListProps = {
  dict: Dictionary;
  tone?: "light" | "dark";
  className?: string;
};

export function ContactChannelList({
  dict,
  tone = "light",
  className,
}: ContactChannelListProps) {
  const channels = contactChannels(dict);
  const isDark = tone === "dark";

  return (
    <ul className={cn("flex flex-col", className)}>
      {channels.map((channel) => (
        <li
          key={channel.key}
          className={cn(
            "border-b",
            isDark ? "border-bone-100/12" : "border-ink-900/10",
          )}
        >
          <a
            href={channel.href}
            {...(channel.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={cn(
              "group flex min-h-14 items-center gap-4 py-4 transition-colors",
              isDark ? "text-bone-100 hover:text-gold-300" : "text-ink-900 hover:text-gold-500",
            )}
          >
            <channel.Icon
              className={cn(
                "h-5 w-5 shrink-0",
                isDark ? "text-gold-400" : "text-gold-500",
              )}
            />
            <span className="flex flex-col">
              <span
                className={cn(
                  "eyebrow",
                  isDark ? "text-bone-300/60" : "text-ink-500",
                )}
              >
                {channel.label}
              </span>
              <span className="mt-1 text-[0.98rem]">{channel.value}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
