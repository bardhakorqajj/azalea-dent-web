import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic, type TeamMember } from "@/content/clinic";
import { teamPhotos } from "@/content/team-photos";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { initials } from "@/lib/utils";

function Portrait({ member, sizes }: { member: TeamMember; sizes: string }) {
  const photo = member.photo ? teamPhotos[member.photo] : undefined;

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-900">
      {photo ? (
        <Image
          src={photo}
          alt={member.name}
          placeholder="blur"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-display text-[3rem] text-gold-400"
        >
          {initials(member.name)}
        </span>
      )}
    </div>
  );
}

function Details({ member, locale }: { member: TeamMember; locale: Locale }) {
  return (
    <>
      <h3 className="text-[1.4rem] leading-snug text-ink-900">{member.name}</h3>
      <p className="eyebrow mt-2.5 text-gold-700">{member.role[locale]}</p>
      {member.bio && (
        <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-600">
          {member.bio[locale]}
        </p>
      )}
    </>
  );
}

/**
 * Renders nothing until real team members are added in `content/clinic.ts`.
 * A single dentist is laid out beside their portrait rather than stranded in a
 * three-column grid, so a one-person clinic still looks deliberate.
 */
export function Team({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  if (clinic.team.length === 0) return null;
  const solo = clinic.team.length === 1 ? clinic.team[0] : undefined;

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

        {solo ? (
          <Reveal delay={80}>
            <div className="mt-12 grid items-center gap-8 sm:grid-cols-[minmax(0,17rem)_1fr] sm:gap-14 lg:mt-16">
              <Portrait member={solo} sizes="(min-width: 640px) 17rem, 100vw" />
              <div>
                <Details member={solo} locale={locale} />
              </div>
            </div>
          </Reveal>
        ) : (
          <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {clinic.team.map((member, index) => (
              <li key={member.name}>
                <Reveal delay={Math.min(index * 70, 240)}>
                  <Portrait
                    member={member}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                  <div className="mt-5">
                    <Details member={member} locale={locale} />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
