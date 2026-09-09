import { createHash } from "node:crypto";

import { execute, queryOne } from "@/lib/db/client";

/**
 * Brute-force protection for the login form.
 *
 * The counter lives in the database, not in memory. Serverless platforms run
 * many short-lived instances of the same app, so an in-process counter is
 * reset for an attacker every few requests — it looks like protection and
 * provides almost none. One shared table is the only place a limit can
 * actually hold.
 *
 * Two scopes are counted independently:
 *   - the client IP, which stops one machine grinding through a word list;
 *   - the account itself, which stops a botnet spreading the same attack
 *     across thousands of addresses.
 */

const WINDOW_MINUTES = 15;
const MAX_PER_IP = 10;
const MAX_PER_ACCOUNT = 20;

export type RateLimitVerdict = {
  limited: boolean;
  /** Seconds until the oldest attempt in the window ages out. */
  retryAfterSeconds: number;
  remaining: number;
};

/** IPs are hashed so the table is a counter, not a log of who visited. */
function ipScope(ip: string | null): string {
  const value = ip && ip.trim() !== "" ? ip.trim() : "unknown";
  return `ip:${createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
}

const ACCOUNT_SCOPE = "account:admin";

async function countFailures(
  scope: string,
): Promise<{ failures: number; oldest: Date | null }> {
  const row = await queryOne<{ failures: string; oldest: Date | null }>(
    `select count(*)::text as failures, min(created_at) as oldest
       from auth_attempt
      where scope = $1
        and successful = false
        and created_at > now() - ($2 || ' minutes')::interval`,
    [scope, String(WINDOW_MINUTES)],
  );

  return { failures: Number(row?.failures ?? 0), oldest: row?.oldest ?? null };
}

function verdict(failures: number, max: number, oldest: Date | null): RateLimitVerdict {
  if (failures < max) {
    return { limited: false, retryAfterSeconds: 0, remaining: max - failures };
  }

  const windowEndsAt = (oldest?.getTime() ?? Date.now()) + WINDOW_MINUTES * 60_000;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEndsAt - Date.now()) / 1000));
  return { limited: true, retryAfterSeconds, remaining: 0 };
}

/** Checked before a password is ever compared. */
export async function checkLoginRateLimit(
  ip: string | null,
): Promise<RateLimitVerdict> {
  const [byIp, byAccount] = await Promise.all([
    countFailures(ipScope(ip)),
    countFailures(ACCOUNT_SCOPE),
  ]);

  const ipVerdict = verdict(byIp.failures, MAX_PER_IP, byIp.oldest);
  if (ipVerdict.limited) return ipVerdict;

  const accountVerdict = verdict(byAccount.failures, MAX_PER_ACCOUNT, byAccount.oldest);
  if (accountVerdict.limited) return accountVerdict;

  return {
    limited: false,
    retryAfterSeconds: 0,
    remaining: Math.min(ipVerdict.remaining, accountVerdict.remaining),
  };
}

/**
 * Records the outcome of an attempt. A success clears that IP's failures, so
 * the owner mistyping their password a few times and then getting it right is
 * not left locked out.
 */
export async function recordLoginAttempt(
  ip: string | null,
  successful: boolean,
): Promise<void> {
  const scope = ipScope(ip);

  if (successful) {
    await execute("delete from auth_attempt where scope in ($1, $2)", [
      scope,
      ACCOUNT_SCOPE,
    ]);
    return;
  }

  await execute(
    `insert into auth_attempt (scope, successful) values ($1, false), ($2, false)`,
    [scope, ACCOUNT_SCOPE],
  );

  /* Keeps the table from growing without bound. Cheap, and only on failure. */
  await execute("delete from auth_attempt where created_at < now() - interval '1 day'");
}

/**
 * A general limiter for public endpoints — the appointment form and the
 * contact form — reusing the same table.
 *
 * Returns true when the request should be refused.
 */
export async function throttlePublic(
  name: string,
  ip: string | null,
  options: { max: number; windowMinutes: number },
): Promise<boolean> {
  const scope = `${name}:${ipScope(ip)}`;

  const row = await queryOne<{ hits: string }>(
    `select count(*)::text as hits
       from auth_attempt
      where scope = $1
        and created_at > now() - ($2 || ' minutes')::interval`,
    [scope, String(options.windowMinutes)],
  );

  if (Number(row?.hits ?? 0) >= options.max) return true;

  await execute("insert into auth_attempt (scope, successful) values ($1, true)", [
    scope,
  ]);
  return false;
}
