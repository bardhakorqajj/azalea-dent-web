"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { Close, Menu } from "@/components/ui/Icons";
import { locales, localeNames, path, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
};

export function Header({ locale, dict }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  /* The path the menu was opened on. Navigating changes `pathname`, which
     closes the panel without needing an effect. */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);

  /* Homepage sections that correspond to a navigation destination. */
  const isHome = pathname === path(locale);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const links = [
    { href: path(locale, "/services"), label: dict.nav.services },
    { href: path(locale, "/prices"), label: dict.nav.prices },
    { href: path(locale, "/about"), label: dict.nav.about },
    { href: path(locale, "/gallery"), label: dict.nav.gallery },
    { href: path(locale, "/contact"), label: dict.nav.contact },
  ];

  /* Tracks which homepage section is under the reading line, so the matching
     tab lights up as the page scrolls. Measured on an animation frame rather
     than set straight from the effect body. */
  useEffect(() => {
    // Off the homepage the value is simply not read, so there is nothing to clear.
    if (!isHome) return;

    const ids = ["about", "services", "gallery", "contact"];
    let frame = 0;

    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: string | null = null;
      for (const id of ids) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= line && rect.bottom > line) current = id;
      }
      setActiveSection(current);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isHome]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll and allow Escape to dismiss while the panel is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Same page, other language. */
  const swapLocale = (target: Locale) => {
    const rest = pathname.replace(/^\/(sq|en)/, "");
    return `/${target}${rest}`;
  };

  const isActive = (href: string) => {
    if (isHome) return activeSection !== null && href === path(locale, `/${activeSection}`);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-ink-900/10 bg-bone-50/95 backdrop-blur-md"
          : "border-b border-transparent bg-bone-50",
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-[100rem] items-center justify-between gap-6 px-6 sm:px-8 lg:h-24 lg:px-12">
        <Link
          href={path(locale)}
          className="shrink-0 text-ink-900"
          aria-label={`Azalea Dent, ${dict.nav.home}`}
        >
          <Logo />
        </Link>

        <nav aria-label={dict.nav.menu} className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[0.82rem] font-medium tracking-wide transition-colors",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold-500 after:transition-transform after:duration-300 hover:after:scale-x-100",
                    isActive(link.href)
                      ? "text-ink-900 after:scale-x-100"
                      : "text-ink-600 hover:text-ink-900",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-1.5 text-[0.7rem] tracking-[0.1em] uppercase lg:flex"
            role="group"
            aria-label={dict.nav.language}
          >
            {locales.map((option, index) => (
              <span key={option} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden="true" className="text-ink-300">
                    /
                  </span>
                )}
                <Link
                  href={swapLocale(option)}
                  hrefLang={option}
                  aria-current={option === locale ? "true" : undefined}
                  className={cn(
                    "px-0.5 py-1 transition-colors",
                    option === locale
                      ? "text-ink-900"
                      : "text-ink-500 hover:text-ink-900",
                  )}
                >
                  <span className="sr-only">{localeNames[option]}</span>
                  <span aria-hidden="true">{option}</span>
                </Link>
              </span>
            ))}
          </div>

          <Link
            href={path(locale, "/appointment")}
            className="hidden min-h-11 items-center rounded-sm bg-ink-900 px-6 text-[0.7rem] font-medium tracking-[0.14em] text-bone-50 uppercase transition-colors duration-300 hover:bg-ink-700 lg:inline-flex"
          >
            {dict.nav.appointment}
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-2 inline-flex h-12 w-12 items-center justify-center text-ink-900 lg:hidden"
          >
            <span className="sr-only">
              {open ? dict.nav.closeMenu : dict.nav.openMenu}
            </span>
            {open ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-ink-900/10 bg-bone-50 lg:hidden"
      >
        <nav aria-label={dict.nav.menu} className="px-6 pt-4 pb-8 sm:px-8">
          <ul className="flex flex-col">
            {[{ href: path(locale), label: dict.nav.home }, ...links].map((link) => (
              <li key={link.href} className="border-b border-ink-900/8">
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className="flex min-h-14 items-center font-display text-[1.6rem] text-ink-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={path(locale, "/appointment")}
            className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-sm bg-ink-900 px-6 text-[0.72rem] font-medium tracking-[0.14em] text-bone-50 uppercase"
          >
            {dict.nav.appointment}
          </Link>

          <div className="mt-7 flex items-center gap-2 text-[0.75rem] tracking-[0.1em] uppercase">
            <span className="text-ink-500">{dict.nav.language}</span>
            {locales.map((option) => (
              <Link
                key={option}
                href={swapLocale(option)}
                hrefLang={option}
                aria-current={option === locale ? "true" : undefined}
                className={cn(
                  "px-2 py-2",
                  option === locale ? "text-ink-900 underline underline-offset-4" : "text-ink-500",
                )}
              >
                {localeNames[option]}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
