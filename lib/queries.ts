export const TASK_SELECT = `SELECT t.*, (SELECT count(*)::int FROM comments c WHERE c.task_id = t.id) AS comment_count FROM tasks t`;
