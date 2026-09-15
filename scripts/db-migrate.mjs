#!/usr/bin/env node
/**
 * Applies the SQL migrations in `src/lib/db/migrations` in filename order.
 *
 * Each file runs once, inside a transaction, and is recorded in `_migration`
 * with a checksum — so a migration that has already been applied is skipped,
 * and one that has been edited after the fact is reported rather than silently
 * ignored.
 *
 *   npm run db:migrate            apply anything outstanding
 *   npm run db:migrate -- --status  list what is applied and what is pending
 *
 * Reads DATABASE_URL from the environment, or from .env.local / .env when the
 * variable is not already set.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const migrationsDir = join(root, "src", "lib", "db", "migrations");

/** Minimal .env reader: only fills variables that are not already set. */
function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
    }
  }
}

function connectionString() {
  loadEnvFiles();
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
  if (!url.trim()) {
    console.error(
      "DATABASE_URL is not set.\n" +
        "Set it in .env.local for development, or in your host's environment " +
        "variables for production. See DEPLOYMENT.md.",
    );
    process.exit(1);
  }
  return url.trim();
}

function sslFor(url) {
  if (process.env.PGSSLMODE === "disable") return false;
  if (/[?&]sslmode=disable/.test(url)) return false;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* Left empty: an unparseable URL is the driver's problem to report. */
  }
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
  return { rejectUnauthorized: process.env.PGSSL_STRICT === "1" };
}

function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex").slice(0, 16),
      };
    });
}

async function main() {
  const url = connectionString();
  const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
  await client.connect();

  try {
    await client.query(`
      create table if not exists _migration (
        name        text        primary key,
        checksum    text        not null,
        applied_at  timestamptz not null default now()
      )
    `);

    const { rows: applied } = await client.query(
      "select name, checksum, applied_at from _migration order by name",
    );
    const appliedByName = new Map(applied.map((row) => [row.name, row]));
    const files = migrationFiles();
    const statusOnly = process.argv.includes("--status");

    if (statusOnly) {
      if (files.length === 0) console.log("No migrations found.");
      for (const file of files) {
        const record = appliedByName.get(file.name);
        if (!record) {
          console.log(`pending  ${file.name}`);
        } else if (record.checksum !== file.checksum) {
          console.log(`CHANGED  ${file.name}  (applied ${record.applied_at.toISOString()})`);
        } else {
          console.log(`applied  ${file.name}  ${record.applied_at.toISOString()}`);
        }
      }
      return;
    }

    let count = 0;
    for (const file of files) {
      const record = appliedByName.get(file.name);

      if (record) {
        if (record.checksum !== file.checksum) {
          /* Editing an applied migration means the database and the repository
             disagree about what the schema is. Say so instead of guessing. */
          console.error(
            `\n${file.name} has changed since it was applied.\n` +
              "Applied migrations are immutable — add a new migration instead.",
          );
          process.exit(1);
        }
        continue;
      }

      process.stdout.write(`applying ${file.name} … `);
      await client.query("BEGIN");
      try {
        await client.query(file.sql);
        await client.query(
          "insert into _migration (name, checksum) values ($1, $2)",
          [file.name, file.checksum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        console.log("failed");
        console.error(`\n${error.message}`);
        process.exit(1);
      }
      console.log("done");
      count += 1;
    }

    console.log(
      count === 0 ? "Database is already up to date." : `Applied ${count} migration(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
