import { execute, query } from "@/lib/db/client";
import { json } from "@/lib/db/sql";
import {
  defaultSettings,
  settingKeys,
  type SettingKey,
  type SettingsShape,
} from "@/lib/settings/registry";

/**
 * Clinic settings.
 *
 * Stored one key per row so a single field can be changed without rewriting
 * the whole object, and read back merged over `defaultSettings()` — the values
 * the website already publishes. An unset key therefore behaves exactly as it
 * did before the dashboard existed.
 */

export async function readSettings(): Promise<SettingsShape> {
  const rows = await query<{ key: string; value: unknown }>(
    "select key, value from setting",
  );

  const settings = defaultSettings();

  for (const row of rows) {
    if (!(settingKeys as readonly string[]).includes(row.key)) continue;
    const key = row.key as SettingKey;

    /* Each key is assigned through a narrow check rather than a blind cast:
       the column is jsonb, so a hand-edited row could hold anything, and a
       string where an array belongs would break the public site. */
    const value = row.value;

    switch (key) {
      case "phones":
        if (Array.isArray(value)) {
          settings.phones = value.filter((entry): entry is string => typeof entry === "string");
        }
        break;

      case "hours":
        if (Array.isArray(value)) settings.hours = value as SettingsShape["hours"];
        break;

      case "logoMediaId":
        settings.logoMediaId = typeof value === "string" ? value : null;
        break;

      case "notifyOnAppointment":
      case "notifyOnMessage":
        if (typeof value === "boolean") settings[key] = value;
        break;

      default:
        if (typeof value === "string") settings[key] = value;
        break;
    }
  }

  return settings;
}

/** Writes the keys given, leaving the rest alone. */
export async function writeSettings(
  changes: Partial<SettingsShape>,
): Promise<void> {
  const entries = Object.entries(changes).filter(([key]) =>
    (settingKeys as readonly string[]).includes(key),
  );
  if (entries.length === 0) return;

  /* One statement for the lot: the arrays are unnested into rows and upserted
     together, so saving the settings form is a single round trip. */
  await execute(
    `insert into setting (key, value)
     select k, v::jsonb
       from unnest($1::text[], $2::text[]) as t(k, v)
     on conflict (key) do update
       set value = excluded.value, updated_at = now()`,
    [entries.map(([key]) => key), entries.map(([, value]) => json(value))],
  );
}

export async function resetSetting(key: SettingKey): Promise<void> {
  await execute("delete from setting where key = $1", [key]);
}
