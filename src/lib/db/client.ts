import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

/**
 * The one database connection for the whole application.
 *
 * The public website and the admin dashboard are a single Next.js app, so they
 * share this pool: a service edited in the dashboard is the same row the
 * public service page reads.
 *
 * Serverless platforms create a fresh module scope per cold start but reuse a
 * warm one for many requests, so the pool is cached on `globalThis`. Without
 * that, Next's development server would open a new pool on every hot reload
 * and exhaust the connection limit within minutes.
 */

const POOL_KEY = "__azaleaDentPool" as const;

type PoolHolder = { [POOL_KEY]?: Pool };

/**
 * `date` and `time` come back as strings, not as JavaScript `Date` objects.
 *
 * This matters more than it looks. An appointment is "14:30 on the 4th" in
 * Prishtina; the driver's default is to parse a bare `date` into a `Date` at
 * the *server process's* local midnight, so the same row reads as the 3rd or
 * the 4th depending on where the dashboard is opened from and what timezone
 * the host happens to run in. Keeping the wire format means the day the clinic
 * typed in is the day everyone reads back.
 *
 * `timestamptz` columns (created_at and friends) are left alone: they are true
 * instants and a `Date` is the right type for them.
 */
const DATE_OID = 1082;
const TIME_OID = 1083;

types.setTypeParser(DATE_OID, (value) => value);
types.setTypeParser(TIME_OID, (value) => value);

/**
 * `null` when the app is running without a database — the public website then
 * falls back to the static content it shipped with, and the admin dashboard
 * says plainly that it needs `DATABASE_URL`.
 */
export function connectionString(): string | null {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    null;
  return url && url.trim() !== "" ? url.trim() : null;
}

export function isDatabaseConfigured(): boolean {
  return connectionString() !== null;
}

/**
 * Whether TLS is required. Hosted Postgres (Neon, Supabase, Vercel Postgres,
 * RDS) needs it; a local cluster does not have a certificate at all, so
 * demanding TLS there would fail every connection.
 *
 * `PGSSLMODE=disable` and a `sslmode=` in the URL both switch it off, which is
 * what makes `postgres://localhost/azalea` work in development.
 */
function sslConfig(url: string): { rejectUnauthorized: boolean } | false {
  if (process.env.PGSSLMODE === "disable") return false;
  if (/[?&]sslmode=disable/.test(url)) return false;

  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return false;
  }

  /* Managed providers terminate TLS with a certificate chain Node does not
     always carry, so verification is relaxed rather than skipping TLS —
     the connection is still encrypted. Set PGSSL_STRICT=1 with a provider
     whose chain does verify. */
  return { rejectUnauthorized: process.env.PGSSL_STRICT === "1" };
}

export function getPool(): Pool {
  const url = connectionString();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The admin dashboard needs a Postgres database — see DEPLOYMENT.md.",
    );
  }

  const holder = globalThis as unknown as PoolHolder;
  const existing = holder[POOL_KEY];
  if (existing) return existing;

  const pool = new Pool({
    connectionString: url,
    ssl: sslConfig(url),
    /* Small on purpose. Serverless runs many short-lived instances against one
       database, so a large per-instance pool is how connection limits get hit. */
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: "azalea-dent",
  });

  /* An idle client dropped by the server must not take the process down. */
  pool.on("error", (error) => {
    console.error("Postgres pool error:", error.message);
  });

  holder[POOL_KEY] = pool;
  return pool;
}

/** Runs a parameterised query and returns the rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as unknown[]);
  return result.rows;
}

/** Runs a query expected to match at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Runs a statement and reports how many rows it changed. */
export async function execute(
  text: string,
  params: readonly unknown[] = [],
): Promise<number> {
  const result = await getPool().query(text, params as unknown[]);
  return result.rowCount ?? 0;
}

/**
 * Runs `fn` inside a transaction, committing on return and rolling back on
 * throw. Used wherever one admin action writes more than one row — reordering
 * a list, replacing a gallery image, deleting a patient with their history.
 */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* The connection is already gone; the transaction died with it. */
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Closes the pool. Used by scripts and tests, never by a request. */
export async function closePool(): Promise<void> {
  const holder = globalThis as unknown as PoolHolder;
  const pool = holder[POOL_KEY];
  if (!pool) return;
  delete holder[POOL_KEY];
  await pool.end();
}
