import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clinic } from "@/content/clinic";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Hidden until real, attributable patient reviews are added. */
export function Testimonials({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  if (clinic.testimonials.length === 0) return null;

  return (
    <Section surface="bone">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={dict.testimonials.eyebrow}
            title={dict.testimonials.title}
          />
        </Reveal>

        <ul className="mt-14 grid gap-8 lg:grid-cols-3">
          {clinic.testimonials.map((testimonial, index) => (
            <li key={testimonial.author}>
              <Reveal delay={Math.min(index * 70, 210)}>
                <figure className="flex h-full flex-col border-t border-ink-900/15 pt-7 dark:border-bone-100/15">
                  <blockquote className="font-display text-[1.2rem] leading-relaxed text-ink-800 dark:text-bone-100">
                    &ldquo;{testimonial.quote[locale]}&rdquo;
                  </blockquote>
                  <figcaption className="eyebrow mt-6 text-ink-500 dark:text-bone-300">
                    {testimonial.author}
                    {testimonial.source && (
                      <span className="ml-2 text-ink-500 dark:text-bone-300">
                        · {testimonial.source}
                      </span>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
