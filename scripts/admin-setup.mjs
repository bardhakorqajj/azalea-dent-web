#!/usr/bin/env node
/**
 * Creates or updates the single admin account.
 *
 *   npm run admin:setup                       prompts for email and password
 *   npm run admin:setup -- --email a@b.org    prompts for the password only
 *   npm run admin:setup -- --hash             prints a hash and writes nothing
 *
 * `--hash` is for a host where the database is not reachable from your laptop:
 * it prints a value for the ADMIN_PASSWORD_HASH environment variable, and the
 * application creates the account from it the first time someone signs in.
 *
 * The password is read from the terminal with echo off and never appears in
 * shell history or in the process list — which is why it is not a flag.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  hashPassword,
  passwordProblems,
  PASSWORD_MIN_LENGTH,
} from "../src/lib/admin/password.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Control characters the raw-mode reader has to recognise. */
const ETX = "\u0003"; // Ctrl-C
const EOT = "\u0004"; // Ctrl-D
const BACKSPACE = "\u007f";

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

function argvIndex(name) {
  return process.argv.indexOf(`--${name}`);
}

function flag(name) {
  const index = argvIndex(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function ask(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** Reads a line with the terminal's echo switched off. */
function askSecret(question) {
  return new Promise((resolve, reject) => {
    stdout.write(question);

    if (!stdin.isTTY) {
      /* Piped input (CI, a here-string): read the line as it comes. */
      const rl = createInterface({ input: stdin });
      rl.once("line", (line) => {
        rl.close();
        stdout.write("\n");
        resolve(line);
      });
      return;
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const finish = (outcome) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
      outcome();
    };

    const onData = (char) => {
      if (char === "\r" || char === "\n") {
        finish(() => resolve(value));
        return;
      }
      if (char === ETX || char === EOT) {
        finish(() => reject(new Error("cancelled")));
        return;
      }
      if (char === BACKSPACE || char === "\b") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };

    stdin.on("data", onData);
  });
}

function sslFor(url) {
  if (process.env.PGSSLMODE === "disable") return false;
  if (/[?&]sslmode=disable/.test(url)) return false;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    /* The driver will report an unusable URL. */
  }
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
  return { rejectUnauthorized: process.env.PGSSL_STRICT === "1" };
}

async function main() {
  loadEnvFiles();

  const hashOnly = argvIndex("hash") !== -1;

  let email = flag("email") ?? process.env.ADMIN_EMAIL ?? "";
  if (!hashOnly && !email) {
    email = await ask("Admin email: ");
  }
  if (!hashOnly && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error("That does not look like an email address.");
    process.exit(1);
  }

  const password = await askSecret(
    `Password (at least ${PASSWORD_MIN_LENGTH} characters): `,
  );
  const problems = passwordProblems(password);
  if (problems.length > 0) {
    const explain = {
      tooShort: `it must be at least ${PASSWORD_MIN_LENGTH} characters`,
      tooLong: "it is too long",
      tooCommon: "it is one of the passwords attackers try first",
      noWhitespaceOnly: "it is empty",
    };
    console.error(
      `\nThat password will not do: ${problems.map((p) => explain[p]).join("; ")}.`,
    );
    process.exit(1);
  }

  const again = await askSecret("Repeat the password: ");
  if (again !== password) {
    console.error("\nThe two passwords do not match.");
    process.exit(1);
  }

  const hash = await hashPassword(password);

  if (hashOnly) {
    console.log("\nSet these environment variables on your host:\n");
    if (email) console.log(`ADMIN_EMAIL=${email}`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log(
      "\nThe account is created from them the first time you sign in.\n" +
        "The hash is safe to paste into your host's environment variables — " +
        "it is not the password, and the password cannot be read back out of it.",
    );
    return;
  }

  const url = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "").trim();
  if (!url) {
    console.error(
      "\nDATABASE_URL is not set, so there is no database to write to.\n" +
        "Run `npm run admin:setup -- --hash` instead to get a value for " +
        "ADMIN_PASSWORD_HASH.",
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
  await client.connect();
  try {
    const { rows } = await client.query(
      "select to_regclass('admin_account') as tbl",
    );
    if (!rows[0]?.tbl) {
      console.error("\nThe schema is not there yet. Run `npm run db:migrate` first.");
      process.exit(1);
    }

    await client.query(
      `insert into admin_account (id, email, password_hash)
       values (1, $1, $2)
       on conflict (id) do update
         set email = excluded.email,
             password_hash = excluded.password_hash,
             updated_at = now()`,
      [email.toLowerCase(), hash],
    );

    /* Any session opened with the old password is no longer trustworthy. */
    const { rowCount } = await client.query("delete from admin_session");

    console.log(`\nAdmin account set for ${email}.`);
    if (rowCount > 0) {
      console.log(`Signed out ${rowCount} existing session(s).`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  if (error.message === "cancelled") {
    console.error("\nCancelled.");
    process.exit(130);
  }
  console.error(error);
  process.exit(1);
});
