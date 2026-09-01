import { ChannelIconLinks } from "@/components/layout/ContactChannels";
import { AzaleaMark } from "@/components/ui/AzaleaMark";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export function CtaBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <Section surface="bone" spacing="loose">
      <Container width="text" className="text-center">
        <Reveal>
          <AzaleaMark className="mx-auto h-12 w-12 text-gold-500" weight={2.6} />
          <h2 className="mt-9 text-[2.1rem] leading-[1.1] text-ink-900 sm:text-[2.8rem]">
            {dict.appointment.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-600">
            {dict.appointment.lead}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-3">
            <ButtonLink href={path(locale, "/appointment")} withArrow>
              {dict.actions.bookAppointment}
            </ButtonLink>
            <ChannelIconLinks dict={dict} className="justify-center" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
