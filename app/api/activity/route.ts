import { route } from "@/lib/api";
import { q } from "@/lib/db";
import type { Activity } from "@/lib/types";

export const GET = route(async (_who, req) => {
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(500, Math.max(1, Number(sp.get("limit")) || 200));
  const task = sp.get("task");
  return task
    ? q<Activity>(`SELECT * FROM activity WHERE target_type = 'task' AND target_id = $1 ORDER BY created_at DESC LIMIT $2`, [task, limit])
    : q<Activity>(`SELECT * FROM activity ORDER BY created_at DESC LIMIT $1`, [limit]);
});
