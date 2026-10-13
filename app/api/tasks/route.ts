import { body, day, oneOf, quote, required, route, str, tags } from "@/lib/api";
import { id, log, one, q } from "@/lib/db";
import { TASK_SELECT } from "@/lib/queries";
import type { Col, Task } from "@/lib/types";

const COL_IDS = ["todo", "ash", "san", "done"] as const;

export const GET = route(async () => q<Task>(`${TASK_SELECT} ORDER BY t.position ASC`));

export const POST = route(async (who, req) => {
  const b = await body(req);
  const title = required(b.title, 300, "title");
  const col: Col = b.col == null ? "todo" : oneOf(b.col, COL_IDS, "col");
  const assignee = col === "ash" || col === "san" ? col : col === "done" ? who : b.assignee === "ash" || b.assignee === "san" ? b.assignee : null;
  const top = await one<{ p: number | null }>(`SELECT min(position) AS p FROM tasks WHERE col = $1`, [col]);
  const position = top?.p == null ? 0 : Number(top.p) - 1024;
  const taskId = id();
  await q(
    `INSERT INTO tasks (id, title, description, col, assignee, priority, labels, due, position, created_by, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, ${col === "done" ? "now()" : "NULL"})`,
    [
      taskId,
      title,
      str(b.description, 20_000, "description"),
      col,
      assignee,
      b.priority == null ? "med" : oneOf(b.priority, ["low", "med", "fire"] as const, "priority"),
      JSON.stringify(tags(b.labels)),
      day(b.due, "due"),
      position,
      who,
    ],
  );
  await log(who, "created", "task", taskId, `added ${quote(title)}`);
  return one<Task>(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
});
