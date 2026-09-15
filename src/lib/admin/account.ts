import { execute, queryOne } from "@/lib/db/client";

import { hashPassword, verifyPassword } from "./password.mjs";

/**
 * The one admin account.
 *
 * It can be created two ways, and both end in the same database row:
 *
 *   1. `npm run admin:setup` writes it directly.
 *   2. ADMIN_EMAIL + ADMIN_PASSWORD_HASH in the environment seed it the first
 *      time someone signs in — which is what makes a first deployment
 *      possible on a host whose database is not reachable from a laptop.
 *
 * Once the row exists it is authoritative, so changing the password in
 * Settings sticks and the environment variables can be deleted. There is no
 * path that puts a password in the source code.
 */

export type AdminAccount = {
  email: string;
  name: string | null;
  updatedAt: Date;
};

type AccountRow = {
  email: string;
  password_hash: string;
  name: string | null;
  updated_at: Date;
};

async function readAccountRow(): Promise<AccountRow | null> {
  return queryOne<AccountRow>(
    "select email, password_hash, name, updated_at from admin_account where id = 1",
  );
}

export async function getAdminAccount(): Promise<AdminAccount | null> {
  const row = await readAccountRow();
  if (!row) return null;
  return { email: row.email, name: row.name, updatedAt: row.updated_at };
}

/** Whether an account exists in the database or can be seeded from the environment. */
export async function adminAccountAvailable(): Promise<boolean> {
  if (await readAccountRow()) return true;
  return envSeed() !== null;
}

function envSeed(): { email: string; passwordHash: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!email || !passwordHash) return null;
  /* A stray quote or an obviously wrong value should not look like a
     configured account — it would only fail every login with no explanation. */
  if (!passwordHash.startsWith("scrypt$")) return null;
  return { email: email.toLowerCase(), passwordHash };
}

/**
 * Creates the account row from the environment if it is not there yet.
 * Concurrent first requests race harmlessly: the primary key makes the second
 * insert a no-op.
 */
async function seedFromEnvIfNeeded(): Promise<AccountRow | null> {
  const seed = envSeed();
  if (!seed) return null;

  await execute(
    `insert into admin_account (id, email, password_hash)
     values (1, $1, $2)
     on conflict (id) do nothing`,
    [seed.email, seed.passwordHash],
  );

  return readAccountRow();
}

export type CredentialCheck =
  | { ok: true }
  | { ok: false; reason: "no_account" | "invalid" };

/**
 * Checks an email and password against the account.
 *
 * The password is verified even when the email does not match, so a wrong
 * email and a wrong password cost the same time and the response cannot be
 * used to discover the admin's address.
 */
export async function checkCredentials(
  email: string,
  password: string,
): Promise<CredentialCheck> {
  const row = (await readAccountRow()) ?? (await seedFromEnvIfNeeded());

  if (!row) {
    /* Still spend the time, so "not set up yet" is not measurably different. */
    await verifyPassword(password, "scrypt$16384$8$1$AAAA$AAAA");
    return { ok: false, reason: "no_account" };
  }

  const passwordMatches = await verifyPassword(password, row.password_hash);
  const emailMatches = email.trim().toLowerCase() === row.email.trim().toLowerCase();

  if (!passwordMatches || !emailMatches) return { ok: false, reason: "invalid" };
  return { ok: true };
}

/**
 * Changes the password. Only reachable from Settings, where the caller has
 * already re-entered and verified the current one.
 */
export async function setPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  const changed = await execute(
    `update admin_account
        set password_hash = $1,
            updated_at = now()
      where id = 1`,
    [hash],
  );

  /* No row to update means nobody could have signed in to get here. Refuse
     rather than inventing an account with a placeholder email. */
  if (changed === 0) {
    throw new Error("There is no admin account to change the password for.");
  }
}

/** Verifies the current password before a change is allowed. */
export async function verifyCurrentPassword(password: string): Promise<boolean> {
  const row = await readAccountRow();
  if (!row) return false;
  return verifyPassword(password, row.password_hash);
}

export async function updateAccountDetails(details: {
  email: string;
  name: string | null;
}): Promise<void> {
  await execute(
    `update admin_account
        set email = $1,
            name = $2,
            updated_at = now()
      where id = 1`,
    [details.email.trim().toLowerCase(), details.name?.trim() || null],
  );
}
