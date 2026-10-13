// Web Crypto only, so this runs in both the proxy and route handlers.
import type { Who } from "./types";

export const COOKIE = "teem_session";
export const SESSION_DAYS = 60;

const enc = new TextEncoder();

function secret() {
  return process.env.TEEM_SECRET || process.env.TEEM_PASSCODE || "teem-dev-secret";
}

function b64url(buf: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isWho(v: unknown): v is Who {
  return v === "san" || v === "ash";
}

export async function makeToken(who: Who) {
  const payload = `${who}.${Date.now() + SESSION_DAYS * 86_400_000}`;
  return `${payload}.${await sign(payload)}`;
}

export async function readToken(token: string | undefined | null): Promise<Who | null> {
  if (!token) return null;
  const [who, exp, sig] = token.split(".");
  if (!isWho(who) || !exp || !sig || Number(exp) < Date.now()) return null;
  return same(sig, await sign(`${who}.${exp}`)) ? who : null;
}

/** Compares HMACs rather than raw strings so timing doesn't leak the passcode length. */
export async function passcodeOk(input: string) {
  const expected = process.env.TEEM_PASSCODE || (process.env.VERCEL ? "" : "teem");
  if (!expected) return false;
  return same(await sign(`pc:${input}`), await sign(`pc:${expected}`));
}
