import { HttpError, body, quote, required, route } from "@/lib/api";
import { id as newId, log, one, q } from "@/lib/db";
import type { Comment } from "@/lib/types";

export const GET = route<{ id: string }>(async (_who, _req, { id }) =>
  q<Comment>(`SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`, [id]),
);

export const POST = route<{ id: string }>(async (who, req, { id }) => {
  const b = await body(req);
  const text = required(b.body, 5000, "comment");
  const task = await one<{ title: string }>(`SELECT title FROM tasks WHERE id = $1`, [id]);
  if (!task) throw new HttpError(404, "task not found");
  const c = await one<Comment>(
    `INSERT INTO comments (id, task_id, author, body) VALUES ($1, $2, $3, $4) RETURNING *`,
    [newId(), id, who, text],
  );
  await log(who, "commented", "task", id, `commented on ${quote(task.title)}: ${quote(text)}`);
  return c;
});
