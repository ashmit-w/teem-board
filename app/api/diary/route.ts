import { body, day, oneOf, quote, required, route } from "@/lib/api";
import { id, log, one, q } from "@/lib/db";
import type { DiaryEntry } from "@/lib/types";
import { isoDay } from "@/lib/util";

const MOODS = ["great", "okay", "rough"] as const;

export const GET = route(async () =>
  q<DiaryEntry>(`SELECT * FROM diary ORDER BY entry_date DESC, created_at DESC LIMIT 1000`),
);

export const POST = route(async (who, req) => {
  const b = await body(req);
  const text = required(b.body, 50_000, "entry");
  const entry = await one<DiaryEntry>(
    `INSERT INTO diary (id, author, entry_date, body, mood) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id(), who, day(b.entry_date, "date") ?? isoDay(), text, b.mood ? oneOf(b.mood, MOODS, "mood") : null],
  );
  await log(who, "wrote", "diary", entry!.id, `wrote in the diary: ${quote(text.split("\n")[0])}`);
  return entry;
});
