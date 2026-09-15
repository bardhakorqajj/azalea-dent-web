import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PublicReview } from "@/lib/public/reviews";

/**
 * Hidden until real, attributable patient reviews are published.
 *
 * The reviews are resolved by the caller: those the clinic has published in
 * the dashboard, and otherwise the (deliberately empty) list the site ships
 * with. Nothing here invents one.
 */
export function Testimonials({
  locale,
  dict,
  reviews,
}: {
  locale: Locale;
  dict: Dictionary;
  reviews: PublicReview[];
}) {
  if (reviews.length === 0) return null;

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
          {reviews.map((testimonial, index) => (
            /* Keyed by position as well as name: two patients can share one. */
            <li key={`${testimonial.author}-${index}`}>
              <Reveal delay={Math.min(index * 70, 210)}>
                <figure className="flex h-full flex-col border-t border-ink-900/15 pt-7 dark:border-bone-100/15">
                  {testimonial.rating !== null && (
                    <p
                      aria-label={`${testimonial.rating}/5`}
                      className="mb-3 text-[0.9rem] tracking-[0.15em] text-gold-700 dark:text-gold-400"
                    >
                      <span aria-hidden="true">
                        {"\u2605".repeat(Math.max(0, Math.min(5, testimonial.rating)))}
                      </span>
                    </p>
                  )}
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
