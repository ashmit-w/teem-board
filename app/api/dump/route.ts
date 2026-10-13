import { body, oneOf, quote, required, route } from "@/lib/api";
import { id, log, one, q } from "@/lib/db";
import { DUMP_COLORS, deriveDump } from "@/lib/dump";
import type { DumpItem } from "@/lib/types";

export const GET = route(async () =>
  q<DumpItem>(`SELECT * FROM dump ORDER BY pinned DESC, created_at DESC LIMIT 2000`),
);

export const POST = route(async (who, req) => {
  const b = await body(req);
  const text = required(b.body, 20_000, "note");
  const { url, tags } = deriveDump(text);
  const item = await one<DumpItem>(
    `INSERT INTO dump (id, author, body, url, tags, color) VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING *`,
    [id(), who, text, url, JSON.stringify(tags), b.color ? oneOf(b.color, DUMP_COLORS, "color") : "sun"],
  );
  await log(who, "dumped", "dump", item!.id, `dumped ${quote(text.split("\n")[0])}`);
  return item;
});
