import { HttpError, body, day, has, oneOf, quote, required, route, str, tags } from "@/lib/api";
import { bump, log, one, q } from "@/lib/db";
import { COLS, type ChecklistItem, type Col, type Task, type Who } from "@/lib/types";
import { TASK_SELECT } from "@/lib/queries";

const COL_IDS = ["todo", "ash", "san", "done"] as const;

function checklist(v: unknown): ChecklistItem[] {
  if (!Array.isArray(v)) throw new HttpError(400, "checklist must be a list");
  return v.slice(0, 100).map((it) => ({
    id: typeof it?.id === "string" ? it.id.slice(0, 64) : crypto.randomUUID(),
    text: typeof it?.text === "string" ? it.text.slice(0, 300) : "",
    done: Boolean(it?.done),
  }));
}

export const GET = route<{ id: string }>(async (_who, _req, { id }) => {
  const t = await one<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  if (!t) throw new HttpError(404, "task not found");
  return t;
});

export const PATCH = route<{ id: string }>(async (who, req, { id }) => {
  const b = await body(req);
  const cur = await one<Task>(`SELECT * FROM tasks WHERE id = $1`, [id]);
  if (!cur) throw new HttpError(404, "task not found");

  const next = { ...cur };
  if (has(b, "title")) next.title = required(b.title, 300, "title");
  if (has(b, "description")) next.description = str(b.description, 20_000, "description");
  if (has(b, "priority")) next.priority = oneOf(b.priority, ["low", "med", "fire"] as const, "priority");
  if (has(b, "labels")) next.labels = tags(b.labels);
  if (has(b, "due")) next.due = day(b.due, "due");
  if (has(b, "checklist")) next.checklist = checklist(b.checklist);
  if (has(b, "position")) {
    if (typeof b.position !== "number" || !Number.isFinite(b.position)) throw new HttpError(400, "position must be a number");
    next.position = b.position;
  }
  if (has(b, "assignee")) next.assignee = b.assignee === "ash" || b.assignee === "san" ? (b.assignee as Who) : null;
  if (has(b, "col")) next.col = oneOf(b.col, COL_IDS, "col") as Col;

  // Keep the "X is on it" columns and the assignee in agreement.
  if (next.col === "ash" || next.col === "san") {
    if (has(b, "assignee") && !has(b, "col")) next.col = next.assignee ?? "todo";
    else next.assignee = next.col;
  }
  if (next.col === "done" && !next.assignee) next.assignee = who;

  const moved = next.col !== cur.col;
  const completedSql = !moved ? "completed_at" : next.col === "done" ? "now()" : "NULL";

  await q(
    `UPDATE tasks SET title = $2, description = $3, col = $4, assignee = $5, priority = $6, labels = $7::jsonb,
       due = $8, checklist = $9::jsonb, position = $10, completed_at = ${completedSql}, updated_at = now()
     WHERE id = $1`,
    [id, next.title, next.description, next.col, next.assignee, next.priority, JSON.stringify(next.labels), next.due, JSON.stringify(next.checklist), next.position],
  );

  if (moved) {
    const name = quote(next.title);
    const summary =
      next.col === "done" ? `finished ${name}`
      : next.col === who ? `picked up ${name}`
      : next.col === "todo" ? `put ${name} back in Tasks`
      : `moved ${name} to ${COLS.find((c) => c.id === next.col)!.title}`;
    await log(who, next.col === "done" ? "completed" : "moved", "task", id, summary);
  } else if (next.title !== cur.title) {
    await log(who, "renamed", "task", id, `renamed ${quote(cur.title)} to ${quote(next.title)}`);
  } else if (next.priority !== cur.priority && next.priority === "fire") {
    await log(who, "flagged", "task", id, `set ${quote(next.title)} on fire`);
  } else {
    await bump();
  }
  return one<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
});

export const DELETE = route<{ id: string }>(async (who, _req, { id }) => {
  const cur = await one<Task>(`DELETE FROM tasks WHERE id = $1 RETURNING title`, [id]);
  if (!cur) throw new HttpError(404, "task not found");
  await q(`UPDATE dump SET task_id = NULL WHERE task_id = $1`, [id]);
  await log(who, "deleted", "task", null, `deleted ${quote(cur.title)}`);
  return { ok: true };
});
