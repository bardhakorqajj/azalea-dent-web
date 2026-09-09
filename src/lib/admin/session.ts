import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { execute, query, queryOne } from "@/lib/db/client";

/**
 * Sessions for the single admin account.
 *
 * The cookie holds a long random token; the database holds only its SHA-256.
 * So a leaked database backup cannot be replayed as a login, and the clinic can
 * still revoke a session — which a self-contained signed token (a JWT) cannot
 * do without a blocklist that ends up being this table anyway.
 *
 * The token is high-entropy random rather than derived from anything, so
 * nothing about the account can be read out of a captured cookie.
 */

export const SESSION_COOKIE = "azalea_admin_session";
export const CSRF_COOKIE = "azalea_admin_csrf";

/** Two weeks. Long enough not to nag the owner, short enough to expire. */
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** `last_seen_at` is only written past this age, to save a write per request. */
const TOUCH_AFTER_MS = 60 * 60 * 1000;

const TOKEN_BYTES = 32;

export type AdminSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Whether cookies should carry the `Secure` flag.
 *
 * On in production, off in local development — where the dashboard is served
 * over plain http on localhost and a Secure cookie would simply never be sent
 * back, making it impossible to sign in.
 */
function secureCookies(): boolean {
  if (process.env.ADMIN_COOKIE_INSECURE === "1") return false;
  return process.env.NODE_ENV === "production";
}

type SessionRow = {
  id: string;
  created_at: Date;
  expires_at: Date;
  last_seen_at: Date;
};

/**
 * Creates a session and sets the cookies. Returns the CSRF token so the login
 * response can hand it straight to the form.
 */
export async function createSession(context: {
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ csrfToken: string }> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const csrfToken = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await execute(
    `insert into admin_session (token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4)`,
    [
      hashToken(token),
      expiresAt,
      context.ip ?? null,
      /* Truncated: a user-agent is a hint for the sessions list, not a record. */
      context.userAgent?.slice(0, 300) ?? null,
    ],
  );

  const store = await cookies();
  const secure = secureCookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    /* Lax, not Strict: the dashboard is reached by following a link or typing
       the address, and Strict would drop the cookie on that first navigation
       and bounce a signed-in owner back to the login page. It still blocks the
       cross-site POSTs that matter, and the CSRF token below covers the rest. */
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  /* Readable by the browser on purpose: the double-submit check compares this
     against a field the page puts in every form. It is not a credential — the
     session cookie is, and that one stays httpOnly. */
  store.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  await pruneExpiredSessions();

  return { csrfToken };
}

/**
 * The current session, or null. Also the authorisation check: every admin
 * page, action and API route goes through this (via `requireAdmin`), so being
 * signed in is decided by the database, never by the presence of a cookie.
 */
export async function readSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<SessionRow>(
    `select id, created_at, expires_at, last_seen_at
       from admin_session
      where token_hash = $1
        and expires_at > now()`,
    [hashToken(token)],
  );
  if (!row) return null;

  /* Keeps "last seen" roughly current without a write on every page view. */
  if (Date.now() - row.last_seen_at.getTime() > TOUCH_AFTER_MS) {
    await execute("update admin_session set last_seen_at = now() where id = $1", [
      row.id,
    ]);
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
  };
}

/** Ends the current session and clears the cookies. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await execute("delete from admin_session where token_hash = $1", [
      hashToken(token),
    ]);
  }

  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

/** Ends every session — used after a password change. */
export async function destroyAllSessions(): Promise<number> {
  return execute("delete from admin_session");
}

export async function listSessions(): Promise<
  { id: string; createdAt: Date; lastSeenAt: Date; ip: string | null; userAgent: string | null }[]
> {
  const rows = await query<{
    id: string;
    created_at: Date;
    last_seen_at: Date;
    ip: string | null;
    user_agent: string | null;
  }>(
    `select id, created_at, last_seen_at, ip, user_agent
       from admin_session
      where expires_at > now()
      order by last_seen_at desc
      limit 20`,
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    ip: row.ip,
    userAgent: row.user_agent,
  }));
}

export async function revokeSession(id: string): Promise<void> {
  await execute("delete from admin_session where id = $1", [id]);
}

async function pruneExpiredSessions(): Promise<void> {
  try {
    await execute("delete from admin_session where expires_at < now() - interval '7 days'");
  } catch (error) {
    /* Housekeeping. A failure here must not stop someone signing in. */
    console.error("Pruning expired sessions failed:", error);
  }
}

// === CSRF =================================================================

/** The token the page embeds in its forms, or null when not signed in. */
export async function readCsrfToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? null;
}

/**
 * Constant-time comparison of the form's token against the cookie's.
 *
 * The point of the double submit is that a cross-site page can cause a request
 * to be sent with our cookies, but cannot *read* them to copy the value into
 * the body.
 */
export async function verifyCsrfToken(submitted: unknown): Promise<boolean> {
  if (typeof submitted !== "string" || submitted === "") return false;

  const expected = await readCsrfToken();
  if (!expected) return false;

  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
