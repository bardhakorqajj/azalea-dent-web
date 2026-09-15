import { isDatabaseConfigured, queryOne } from "./client";

/**
 * Whether the database is reachable and migrated.
 *
 * The dashboard checks this before rendering anything that needs data, so a
 * missing `DATABASE_URL` or an un-migrated database produces a page that says
 * exactly what to do rather than a stack trace.
 */

export type DatabaseStatus =
  | { state: "missing" }
  | { state: "unreachable"; error: string }
  | { state: "unmigrated" }
  | { state: "ready"; migrations: number };

export async function databaseStatus(): Promise<DatabaseStatus> {
  if (!isDatabaseConfigured()) return { state: "missing" };

  try {
    const table = await queryOne<{ tbl: string | null }>(
      "select to_regclass('admin_account')::text as tbl",
    );
    if (!table?.tbl) return { state: "unmigrated" };

    const applied = await queryOne<{ count: string }>(
      "select count(*)::text as count from _migration",
    );
    return { state: "ready", migrations: Number(applied?.count ?? 0) };
  } catch (error) {
    return {
      state: "unreachable",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** True only when queries can actually be run. */
export async function databaseReady(): Promise<boolean> {
  return (await databaseStatus()).state === "ready";
}
