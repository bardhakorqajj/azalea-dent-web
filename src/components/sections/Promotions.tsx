import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { text, type PromotionRow } from "@/lib/db/types";

/**
 * The clinic's current offers.
 *
 * Rendered only when the dashboard has an active promotion inside its dates —
 * `livePromotions()` is where that rule lives — so the section is absent from
 * the site entirely the rest of the time. That is deliberate: a dental clinic
 * with a permanent "special offer" band reads as a discount shop, and an
 * empty promotions section would be worse than none.
 *
 * The band is dark, like the visit and CTA bands, so an offer reads as a
 * deliberate interruption of the page rather than another card in the flow.
 */
export function Promotions({
  locale,
  dict,
  promotions,
}: {
  locale: Locale;
  dict: Dictionary;
  promotions: PromotionRow[];
}) {
  if (promotions.length === 0) return null;

  return (
    <Section surface="ink" spacing="tight" className="surface-grain">
      <Container>
        <ul className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {promotions.map((promotion, index) => {
            const title = text(promotion.title, locale);
            const description = text(promotion.description, locale);
            const discount = text(promotion.discount_text, locale);
            const ctaLabel = text(promotion.cta_label, locale);

            return (
              <li key={promotion.id}>
                <Reveal delay={Math.min(index * 80, 160)}>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    {promotion.image_id && (
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm sm:aspect-square sm:w-40">
                        <Image
                          src={`/api/media/${promotion.image_id}`}
                          alt={title}
                          fill
                          sizes="(min-width: 640px) 10rem, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      {discount && (
                        <p className="eyebrow text-gold-400">{discount}</p>
                      )}

                      <h2 className="mt-2 font-display text-[1.5rem] leading-snug text-bone-50 sm:text-[1.7rem]">
                        {title}
                      </h2>

                      {description && (
                        <p className="mt-3 max-w-prose text-[0.98rem] leading-relaxed text-bone-300">
                          {description}
                        </p>
                      )}

                      {/* Falls back to the site's own appointment call, so a
                          promotion saved without a button still leads somewhere. */}
                      <ButtonLink
                        href={promotion.cta_href ?? path(locale, "/appointment")}
                        variant="onDark"
                        size="sm"
                        className="mt-6"
                        withArrow
                      >
                        {ctaLabel || dict.actions.bookAppointment}
                      </ButtonLink>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
