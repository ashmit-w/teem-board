import { HttpError, quote, route } from "@/lib/api";
import { id as newId, log, one, q } from "@/lib/db";
import { TASK_SELECT } from "@/lib/queries";
import type { DumpItem, Task } from "@/lib/types";

/** Turn an info-dump note into a card at the top of Tasks. */
export const POST = route<{ id: string }>(async (who, _req, { id }) => {
  const item = await one<DumpItem>(`SELECT * FROM dump WHERE id = $1`, [id]);
  if (!item) throw new HttpError(404, "item not found");
  if (item.task_id) {
    const existing = await one<Task>(`${TASK_SELECT} WHERE t.id = $1`, [item.task_id]);
    if (existing) return existing;
  }
  const firstLine = item.body.split("\n").find((l) => l.trim()) ?? "From the dump";
  const title = firstLine.replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, "").trim().slice(0, 300) || "From the dump";
  const top = await one<{ p: number | null }>(`SELECT min(position) AS p FROM tasks WHERE col = 'todo'`);
  const taskId = newId();
  await q(
    `INSERT INTO tasks (id, title, description, col, labels, position, created_by) VALUES ($1, $2, $3, 'todo', $4::jsonb, $5, $6)`,
    [taskId, title, item.body, JSON.stringify(item.tags), top?.p == null ? 0 : Number(top.p) - 1024, who],
  );
  await q(`UPDATE dump SET task_id = $2, updated_at = now() WHERE id = $1`, [id, taskId]);
  await log(who, "created", "task", taskId, `turned a dump note into ${quote(title)}`);
  return one<Task>(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
});
