import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/content/clinic";
import { teamPhotos } from "@/content/team-photos";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Renders nothing until real team members are added in `content/clinic.ts` —
 * the site never invents a dentist or a credential.
 */
export function Team({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  if (clinic.team.length === 0) return null;

  return (
    <Section surface="bone-warm">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={dict.team.eyebrow}
            title={dict.team.title}
            lead={dict.team.lead}
          />
        </Reveal>

        <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {clinic.team.map((member, index) => {
            const photo = member.photo ? teamPhotos[member.photo] : undefined;
            const initials = member.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0] ?? "")
              .join("");

            return (
              <li key={member.name}>
                <Reveal delay={Math.min(index * 70, 240)}>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-900">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={member.name}
                        placeholder="blur"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-[3rem] text-gold-400">
                        {initials}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 text-[1.3rem] text-ink-900">{member.name}</h3>
                  <p className="eyebrow mt-2 text-gold-700">{member.role[locale]}</p>
                  {member.bio && (
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-600">
                      {member.bio[locale]}
                    </p>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
