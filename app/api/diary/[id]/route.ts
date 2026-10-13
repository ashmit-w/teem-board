import { HttpError, body, day, has, oneOf, required, route } from "@/lib/api";
import { bump, one, q } from "@/lib/db";
import type { DiaryEntry } from "@/lib/types";

async function own(id: string, who: string) {
  const e = await one<DiaryEntry>(`SELECT * FROM diary WHERE id = $1`, [id]);
  if (!e) throw new HttpError(404, "entry not found");
  if (e.author !== who) throw new HttpError(403, "only the author can change this entry");
  return e;
}

export const PATCH = route<{ id: string }>(async (who, req, { id }) => {
  const b = await body(req);
  const e = await own(id, who);
  const updated = await one<DiaryEntry>(
    `UPDATE diary SET body = $2, entry_date = $3, mood = $4, updated_at = now() WHERE id = $1 RETURNING *`,
    [
      id,
      has(b, "body") ? required(b.body, 50_000, "entry") : e.body,
      has(b, "entry_date") ? (day(b.entry_date, "date") ?? e.entry_date) : e.entry_date,
      has(b, "mood") ? (b.mood ? oneOf(b.mood, ["great", "okay", "rough"] as const, "mood") : null) : e.mood,
    ],
  );
  await bump();
  return updated;
});

export const DELETE = route<{ id: string }>(async (who, _req, { id }) => {
  await own(id, who);
  await q(`DELETE FROM diary WHERE id = $1`, [id]);
  await bump();
  return { ok: true };
});
