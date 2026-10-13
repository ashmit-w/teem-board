import { cookies } from "next/headers";
import { COOKIE, readToken } from "./auth";
import type { Who } from "./types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function currentWho(): Promise<Who | null> {
  return readToken((await cookies()).get(COOKIE)?.value);
}

/**
 * Wraps a route handler: checks the session (the proxy's check is only optimistic),
 * JSON-encodes plain return values and turns thrown HttpErrors into responses.
 */
export function route<P = Record<string, string>>(
  fn: (who: Who, req: Request, params: P) => Promise<unknown>,
) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    const who = await currentWho();
    if (!who) return Response.json({ error: "unauthorized" }, { status: 401 });
    try {
      const out = await fn(who, req, await (ctx?.params ?? Promise.resolve({} as P)));
      return out instanceof Response ? out : Response.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json({ error: e instanceof Error ? e.message : "server error" }, { status: 500 });
    }
  };
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
}

// --- tiny validators -------------------------------------------------------

export function str(v: unknown, max = 10_000, field = "value"): string {
  if (v == null) return "";
  if (typeof v !== "string") throw new HttpError(400, `${field} must be text`);
  return v.slice(0, max);
}

export function required(v: unknown, max: number, field: string): string {
  const s = str(v, max, field).trim();
  if (!s) throw new HttpError(400, `${field} is required`);
  return s;
}

export function oneOf<T extends string>(v: unknown, options: readonly T[], field: string): T {
  if (!options.includes(v as T)) throw new HttpError(400, `${field} must be one of ${options.join(", ")}`);
  return v as T;
}

export function day(v: unknown, field: string): string | null {
  if (v == null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, `${field} must be YYYY-MM-DD`);
  return v;
}

export function tags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const t of v) {
    if (typeof t !== "string") continue;
    const clean = t.trim().replace(/^#/, "").toLowerCase().slice(0, 32);
    if (clean) out.add(clean);
  }
  return [...out].slice(0, 12);
}

export const has = (b: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(b, k);

export const quote = (s: string) => `“${s.length > 60 ? s.slice(0, 57) + "…" : s}”`;
