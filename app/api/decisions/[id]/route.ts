import { HttpError, body, day, has, oneOf, quote, required, route, str } from "@/lib/api";
import { bump, log, one, q } from "@/lib/db";
import type { Decision } from "@/lib/types";

export const PATCH = route<{ id: string }>(async (who, req, { id }) => {
  const b = await body(req);
  const cur = await one<Decision>(`SELECT * FROM decisions WHERE id = $1`, [id]);
  if (!cur) throw new HttpError(404, "decision not found");
  const status = has(b, "status") ? oneOf(b.status, ["proposed", "decided", "revisit"] as const, "status") : cur.status;
  const d = await one<Decision>(
    `UPDATE decisions SET title = $2, context = $3, decision = $4, why = $5, status = $6, decided_on = $7, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [
      id,
      has(b, "title") ? required(b.title, 300, "title") : cur.title,
      has(b, "context") ? str(b.context, 20_000, "context") : cur.context,
      has(b, "decision") ? str(b.decision, 20_000, "decision") : cur.decision,
      has(b, "why") ? str(b.why, 20_000, "why") : cur.why,
      status,
      has(b, "decided_on") ? (day(b.decided_on, "date") ?? cur.decided_on) : cur.decided_on,
    ],
  );
  if (status !== cur.status) await log(who, "decided", "decision", id, `marked ${quote(d!.title)} as ${status}`);
  else await bump();
  return d;
});

export const DELETE = route<{ id: string }>(async (who, _req, { id }) => {
  const d = await one<Decision>(`DELETE FROM decisions WHERE id = $1 RETURNING title`, [id]);
  if (d) await log(who, "deleted", "decision", null, `deleted the decision ${quote(d.title)}`);
  return { ok: true };
});
