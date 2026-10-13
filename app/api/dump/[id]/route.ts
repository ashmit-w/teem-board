import { HttpError, body, has, oneOf, required, route } from "@/lib/api";
import { bump, one, q } from "@/lib/db";
import { DUMP_COLORS, deriveDump } from "@/lib/dump";
import type { DumpItem } from "@/lib/types";

export const PATCH = route<{ id: string }>(async (_who, req, { id }) => {
  const b = await body(req);
  const cur = await one<DumpItem>(`SELECT * FROM dump WHERE id = $1`, [id]);
  if (!cur) throw new HttpError(404, "item not found");
  const text = has(b, "body") ? required(b.body, 20_000, "note") : cur.body;
  const { url, tags } = deriveDump(text);
  const item = await one<DumpItem>(
    `UPDATE dump SET body = $2, url = $3, tags = $4::jsonb, color = $5, pinned = $6, updated_at = now() WHERE id = $1 RETURNING *`,
    [
      id,
      text,
      url,
      JSON.stringify(tags),
      has(b, "color") ? oneOf(b.color, DUMP_COLORS, "color") : cur.color,
      has(b, "pinned") ? Boolean(b.pinned) : cur.pinned,
    ],
  );
  await bump();
  return item;
});

export const DELETE = route<{ id: string }>(async (_who, _req, { id }) => {
  await q(`DELETE FROM dump WHERE id = $1`, [id]);
  await bump();
  return { ok: true };
});
