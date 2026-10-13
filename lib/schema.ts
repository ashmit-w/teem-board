// Bump SCHEMA_VERSION whenever SCHEMA changes; statements must stay idempotent.
export const SCHEMA_VERSION = 1;

export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS teem_meta (k text PRIMARY KEY, v text NOT NULL)`,
  `INSERT INTO teem_meta (k, v) VALUES ('rev', '0') ON CONFLICT (k) DO NOTHING`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    col text NOT NULL DEFAULT 'todo',
    assignee text,
    priority text NOT NULL DEFAULT 'med',
    labels jsonb NOT NULL DEFAULT '[]',
    due text,
    checklist jsonb NOT NULL DEFAULT '[]',
    position double precision NOT NULL DEFAULT 0,
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS tasks_col_pos ON tasks (col, position)`,

  `CREATE TABLE IF NOT EXISTS comments (
    id text PRIMARY KEY,
    task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author text NOT NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS comments_task ON comments (task_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS activity (
    id text PRIMARY KEY,
    actor text NOT NULL,
    verb text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    summary text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS activity_time ON activity (created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS diary (
    id text PRIMARY KEY,
    author text NOT NULL,
    entry_date text NOT NULL,
    body text NOT NULL,
    mood text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS diary_date ON diary (entry_date DESC, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS dump (
    id text PRIMARY KEY,
    author text NOT NULL,
    body text NOT NULL DEFAULT '',
    url text,
    tags jsonb NOT NULL DEFAULT '[]',
    color text NOT NULL DEFAULT 'sun',
    pinned boolean NOT NULL DEFAULT false,
    task_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS decisions (
    id text PRIMARY KEY,
    title text NOT NULL,
    context text NOT NULL DEFAULT '',
    decision text NOT NULL DEFAULT '',
    why text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'decided',
    author text NOT NULL,
    decided_on text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS weekly (
    week text NOT NULL,
    person text NOT NULL,
    wins text NOT NULL DEFAULT '',
    blockers text NOT NULL DEFAULT '',
    next text NOT NULL DEFAULT '',
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (week, person)
  )`,

  `CREATE TABLE IF NOT EXISTS presence (
    who text PRIMARY KEY,
    page text NOT NULL DEFAULT '',
    seen_at timestamptz NOT NULL DEFAULT now()
  )`,
];
