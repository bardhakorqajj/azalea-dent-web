/**
 * Password hashing for the single admin account.
 *
 * Written as plain ESM rather than TypeScript on purpose: the setup script
 * (`npm run admin:setup`) runs it directly under Node, and the application
 * imports the same module, so there is exactly one implementation of the
 * hash format and no chance of the two drifting apart.
 *
 * scrypt from Node's own crypto is used rather than a dependency: it is a
 * memory-hard KDF designed for exactly this, and it needs nothing installed.
 *
 * Stored format, a single line of ASCII:
 *
 *   scrypt$<N>$<r>$<p>$<salt base64url>$<hash base64url>
 *
 * The parameters travel with the hash, so raising them later still leaves
 * older hashes verifiable.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/** ~64 MB of memory per hash: costly for an attacker, unnoticed on one login. */
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

/**
 * @param {string} password
 * @param {Buffer} salt
 * @param {{ N: number, r: number, p: number }} params
 * @returns {Promise<Buffer>}
 */
function derive(password, salt, params) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      /* maxmem has to allow for 128 * N * r plus scrypt's own overhead, or
         Node rejects the very parameters we asked for. */
      { N: params.N, r: params.r, p: params.p, maxmem: 256 * params.N * params.r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/**
 * Hashes a password for storage.
 *
 * @param {string} password
 * @returns {Promise<string>} the encoded hash, safe to store or put in an env var
 */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, DEFAULT_PARAMS);
  const { N, r, p } = DEFAULT_PARAMS;
  return [
    "scrypt",
    N,
    r,
    p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/**
 * Checks a password against a stored hash.
 *
 * Returns false rather than throwing for a malformed or unsupported hash, so a
 * damaged stored value fails the login instead of crashing the route. The
 * comparison is constant-time.
 *
 * @param {string} password
 * @param {string | null | undefined} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;

  const parts = stored.trim().split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  /* Refuse absurd parameters from a tampered value: they would either be
     trivially weak or exhaust memory on purpose. */
  if (N < 1024 || N > 1 << 20 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;

  let actual;
  try {
    actual = await derive(password, salt, { N, r, p });
  } catch {
    return false;
  }

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Why a password is unacceptable, as message keys the admin dictionary
 * translates. An empty array means it is fine.
 *
 * Length is the requirement that actually matters for a single account behind
 * rate limiting, so the rules stay short: long enough, not absurd, and not one
 * of the handful of passwords every scanner tries first.
 *
 * @param {string} password
 * @returns {("tooShort" | "tooLong" | "tooCommon" | "noWhitespaceOnly")[]}
 */
export function passwordProblems(password) {
  /** @type {("tooShort" | "tooLong" | "tooCommon" | "noWhitespaceOnly")[]} */
  const problems = [];
  const value = typeof password === "string" ? password : "";

  if (value.trim().length === 0) {
    problems.push("noWhitespaceOnly");
    return problems;
  }
  if (value.length < PASSWORD_MIN_LENGTH) problems.push("tooShort");
  if (value.length > PASSWORD_MAX_LENGTH) problems.push("tooLong");

  const COMMON = [
    "password", "passw0rd", "123456789", "1234567890", "qwertyuiop",
    "letmein", "admin", "administrator", "welcome", "iloveyou",
    "azaleadent", "azalea", "dentist", "clinic",
  ];
  const lowered = value.toLowerCase();
  if (COMMON.some((common) => lowered === common || lowered.startsWith(`${common}1`))) {
    problems.push("tooCommon");
  }

  return problems;
}
