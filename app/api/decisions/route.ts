import { body, day, oneOf, quote, required, route, str } from "@/lib/api";
import { id, log, one, q } from "@/lib/db";
import type { Decision } from "@/lib/types";
import { isoDay } from "@/lib/util";

export const GET = route(async () => q<Decision>(`SELECT * FROM decisions ORDER BY decided_on DESC, created_at DESC`));

export const POST = route(async (who, req) => {
  const b = await body(req);
  const title = required(b.title, 300, "title");
  const d = await one<Decision>(
    `INSERT INTO decisions (id, title, context, decision, why, status, author, decided_on)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      id(),
      title,
      str(b.context, 20_000, "context"),
      str(b.decision, 20_000, "decision"),
      str(b.why, 20_000, "why"),
      b.status ? oneOf(b.status, ["proposed", "decided", "revisit"] as const, "status") : "decided",
      who,
      day(b.decided_on, "date") ?? isoDay(),
    ],
  );
  await log(who, d!.status === "proposed" ? "proposed" : "decided", "decision", d!.id,
    `${d!.status === "proposed" ? "proposed" : "logged a decision:"} ${quote(title)}`);
  return d;
});
