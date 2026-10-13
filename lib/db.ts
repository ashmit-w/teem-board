import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Activity, Who } from "./types";
import { SCHEMA, SCHEMA_VERSION } from "./schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
type LocalDb = { query: (text: string, params?: unknown[]) => Promise<{ rows: Row[] }> };

// Survive Next dev hot-reloads and reuse across invocations of a warm function.
const g = globalThis as unknown as {
  __teemNeon?: NeonQueryFunction<false, false>;
  __teemLocal?: Promise<LocalDb>;
  __teemReady?: Promise<void>;
};

const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

async function exec(text: string, params: unknown[] = []): Promise<Row[]> {
  const url = dbUrl();
  if (url) {
    g.__teemNeon ??= neon(url);
    return (await g.__teemNeon.query(text, params)) as Row[];
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. In Vercel: Storage → connect a Neon database to this project, then redeploy.");
  }
  g.__teemLocal ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    return new PGlite("./.pglite") as unknown as LocalDb;
  })();
  const db = await g.__teemLocal;
  return (await db.query(text, params)).rows;
}

async function migrate() {
  try {
    const rows = await exec(`SELECT v FROM teem_meta WHERE k = 'schema'`);
    if (rows[0]?.v === String(SCHEMA_VERSION)) return;
  } catch {
    // first boot: teem_meta does not exist yet
  }
  for (const stmt of SCHEMA) await exec(stmt);
  await exec(
    `INSERT INTO teem_meta (k, v) VALUES ('schema', $1) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v`,
    [String(SCHEMA_VERSION)],
  );
}

function ready() {
  g.__teemReady ??= migrate().catch((e) => {
    g.__teemReady = undefined;
    throw e;
  });
  return g.__teemReady;
}

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await exec(text, params)) as T[];
}

export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}

export const id = () => crypto.randomUUID();

/** Record what happened and bump the board revision so other tabs refetch. One round trip. */
export async function log(
  actor: Who,
  verb: string,
  targetType: Activity["target_type"],
  targetId: string | null,
  summary: string,
) {
  await q(
    `WITH a AS (
       INSERT INTO activity (id, actor, verb, target_type, target_id, summary) VALUES ($1, $2, $3, $4, $5, $6)
     )
     UPDATE teem_meta SET v = (v::bigint + 1)::text WHERE k = 'rev'`,
    [id(), actor, verb, targetType, targetId, summary],
  );
}

/** Bump the revision without an activity line (small edits like ticking a checklist). */
export async function bump() {
  await q(`UPDATE teem_meta SET v = (v::bigint + 1)::text WHERE k = 'rev'`);
}
