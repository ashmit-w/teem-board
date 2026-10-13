import { HttpError, body, day, route, str } from "@/lib/api";
import { bump, log, one, q } from "@/lib/db";
import type { Weekly } from "@/lib/types";
import { weekOf } from "@/lib/util";

export const GET = route(async (_who, req) => {
  const week = day(new URL(req.url).searchParams.get("week"), "week") ?? weekOf();
  const [entries, weeks] = await Promise.all([
    q<Weekly>(`SELECT * FROM weekly WHERE week = $1`, [week]),
    q<{ week: string }>(`SELECT DISTINCT week FROM weekly ORDER BY week DESC LIMIT 104`),
  ]);
  return { week, entries, weeks: weeks.map((w) => w.week) };
});

export const PUT = route(async (who, req) => {
  const b = await body(req);
  const week = day(b.week, "week");
  if (!week) throw new HttpError(400, "week is required");
  const row = await one<Weekly & { inserted: boolean }>(
    `INSERT INTO weekly (week, person, wins, blockers, next) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (week, person) DO UPDATE SET wins = EXCLUDED.wins, blockers = EXCLUDED.blockers, next = EXCLUDED.next, updated_at = now()
     RETURNING *, (xmax = 0) AS inserted`,
    [week, who, str(b.wins, 20_000, "wins"), str(b.blockers, 20_000, "blockers"), str(b.next, 20_000, "next")],
  );
  if (row?.inserted) await log(who, "checked in", "weekly", week, `started their weekly check-in`);
  else await bump();
  return row;
});
