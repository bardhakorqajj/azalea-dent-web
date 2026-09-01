import { ChevronDown } from "@/components/ui/Icons";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * Native `<details>` accordion — keyboard accessible and fully functional
 * without JavaScript.
 */
export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <Section surface="bone-warm">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <SectionHeading eyebrow={dict.faq.eyebrow} title={dict.faq.title} />
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <div className="border-t border-ink-900/12">
              {dict.faq.items.map((item, index) => (
                <Reveal key={item.question} delay={Math.min(index * 50, 200)}>
                  <details className="group border-b border-ink-900/12">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                      <h3 className="text-[1.15rem] leading-snug text-ink-900 sm:text-[1.25rem]">
                        {item.question}
                      </h3>
                      <ChevronDown className="h-5 w-5 shrink-0 text-gold-500 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="max-w-2xl pr-8 pb-7 text-[0.98rem] leading-relaxed text-ink-600">
                      {item.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
