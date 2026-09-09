import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { teamPhotos } from "@/content/team-photos";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PublicTeamMember } from "@/lib/public/team";
import { initials } from "@/lib/utils";

function Portrait({ member, sizes }: { member: PublicTeamMember; sizes: string }) {
  const photo = member.photo ? teamPhotos[member.photo] : undefined;

  return (
    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-ink-900 dark:bg-ink-950">
      {photo ? (
        <Image
          src={photo}
          alt={member.name}
          placeholder="blur"
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      ) : member.photoUrl ? (
        /* An uploaded portrait. No `placeholder="blur"`: there is no build-time
           blur data for a file the clinic added after the build. */
        <Image
          src={member.photoUrl}
          alt={member.name}
          width={480}
          height={480}
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

function Details({ member, locale }: { member: PublicTeamMember; locale: Locale }) {
  return (
    <>
      <h3 className="text-[1.4rem] leading-snug text-ink-900 dark:text-bone-50">
        {member.name}
      </h3>
      <p className="eyebrow mt-2.5 text-gold-700 dark:text-gold-400">
        {member.role[locale]}
      </p>
      {member.bio && (
        <p className="mx-auto mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-600 dark:text-bone-300">
          {member.bio[locale]}
        </p>
      )}
    </>
  );
}

/**
 * Renders nothing until real team members are added in `content/clinic.ts`.
 * Each card caps its width, so a single dentist reads as a deliberate card
 * rather than being stretched across a three-column grid.
 */
export function Team({
  locale,
  dict,
  members,
}: {
  locale: Locale;
  dict: Dictionary;
  /** Resolved by the caller: the dashboard's team, or the shipped list. */
  members: PublicTeamMember[];
}) {
  if (members.length === 0) return null;

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

        {/* Centred row, so one dentist sits in the middle rather than
            at the left edge of a grid. */}
        <ul className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-14 lg:mt-16">
          {members.map((member, index) => (
            /* Capped width so a single dentist is not stretched across the grid. */
            <li key={member.name} className="w-full max-w-[17rem] text-center">
              <Reveal delay={Math.min(index * 70, 240)}>
                <Portrait
                  member={member}
                  sizes="(min-width: 1024px) 17rem, (min-width: 640px) 45vw, 100vw"
                />
                <div className="mt-6">
                  <Details member={member} locale={locale} />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
