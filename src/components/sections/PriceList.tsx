import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { formatPrice, priceGroups, type PriceGroup } from "@/content/prices";
import { path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** One category's treatments and prices, name left and price right. */
export function PriceGroupTable({
  group,
  locale,
}: {
  group: PriceGroup;
  locale: Locale;
}) {
  return (
    <dl>
      {group.items.map((item) => (
        <div
          key={item.name.sq}
          className="flex items-baseline justify-between gap-6 border-b border-ink-900/8 py-3.5"
        >
          <dt className="text-[0.98rem] leading-snug text-ink-700">
            {item.name[locale]}
          </dt>
          <dd className="shrink-0 text-[0.98rem] font-medium whitespace-nowrap text-ink-900 tabular-nums">
            {formatPrice(item.price)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The clinic's price list, grouped exactly as it is on the printed sheet at
 * reception. Two columns of groups on wide screens, one on a phone; prices
 * stay on the same line as the treatment at every width.
 */
export function PriceList({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <Section surface="bone">
      <Container>
        <Reveal>
          <p className="max-w-2xl border-l-2 border-gold-500 pl-5 text-[0.95rem] leading-relaxed text-ink-600">
            {dict.prices.note}
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-x-16 gap-y-14 lg:grid-cols-2 lg:gap-y-16">
          {priceGroups.map((group, index) => (
            <Reveal key={group.id} delay={Math.min(index * 50, 200)}>
              <section aria-labelledby={`price-${group.id}`}>
                <h2
                  id={`price-${group.id}`}
                  className="eyebrow border-b border-ink-900/15 pb-4 font-sans text-gold-700"
                >
                  {group.title[locale]}
                </h2>

                <PriceGroupTable group={group} locale={locale} />
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 border-t border-ink-900/12 pt-10">
            <h2 className="font-display text-[1.5rem] text-ink-900">
              {dict.prices.ctaTitle}
            </h2>
            <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-ink-600">
              {dict.prices.ctaBody}
            </p>
            <ButtonLink
              href={path(locale, "/contact")}
              variant="secondary"
              className="mt-7"
            >
              {dict.nav.contact}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
