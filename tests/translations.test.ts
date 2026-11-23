import { describe, expect, it } from "vitest";

import { withShippedTranslations } from "@/lib/public/translations";

describe("withShippedTranslations", () => {
  const shipped = { sq: "Ortodonci", en: "Orthodontics", de: "Kieferorthopädie" };

  it("fills a language the stored row is missing while its Albanian is unchanged", () => {
    expect(withShippedTranslations({ sq: "Ortodonci", en: "Orthodontics" }, shipped)).toEqual(
      shipped,
    );
  });

  it("never replaces a language the clinic has typed", () => {
    const stored = { sq: "Ortodonci", en: "Orthodontics", de: "Zahnspangen" };
    expect(withShippedTranslations(stored, shipped).de).toBe("Zahnspangen");
  });

  it("treats a blank field as missing", () => {
    expect(withShippedTranslations({ sq: "Ortodonci", de: "  " }, shipped).de).toBe(
      "Kieferorthopädie",
    );
  });

  it("uses nothing once the Albanian has been rewritten", () => {
    const stored = { sq: "Ortodonci dhe retainerë", en: "Orthodontics" };
    expect(withShippedTranslations(stored, shipped)).toEqual(stored);
  });

  it("leaves the row alone when there is nothing shipped to match", () => {
    const stored = { sq: "Shërbim i ri" };
    expect(withShippedTranslations(stored, undefined)).toEqual(stored);
    expect(withShippedTranslations(null, shipped)).toEqual({});
  });
});
