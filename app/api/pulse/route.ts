import { route } from "@/lib/api";
import { one } from "@/lib/db";
import type { Activity, Pulse, Who } from "@/lib/types";

/** Polled by every open tab: marks me present and returns the board revision + latest activity. */
export const GET = route(async (who, req) => {
  const page = (new URL(req.url).searchParams.get("page") ?? "").slice(0, 40);
  const r = await one<{ rev: string; presence: Pulse["presence"] | null; latest: Activity | null }>(
    `WITH me AS (
       INSERT INTO presence (who, page, seen_at) VALUES ($1, $2, now())
       ON CONFLICT (who) DO UPDATE SET page = EXCLUDED.page, seen_at = now()
     )
     SELECT (SELECT v FROM teem_meta WHERE k = 'rev') AS rev,
            (SELECT json_agg(p) FROM (SELECT who, page, seen_at FROM presence) p) AS presence,
            (SELECT row_to_json(a) FROM (SELECT * FROM activity ORDER BY created_at DESC LIMIT 1) a) AS latest`,
    [who satisfies Who, page],
  );
  return { rev: Number(r?.rev ?? 0), presence: r?.presence ?? [], latest: r?.latest ?? null } satisfies Pulse;
});
