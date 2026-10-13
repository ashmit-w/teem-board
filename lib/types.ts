// Shared between server and client — no server-only imports here.

export type Who = "san" | "ash";
export const WHO: Who[] = ["ash", "san"];

export const PEOPLE: Record<Who, { name: string; short: string; tone: string }> = {
  ash: { name: "Ashmit", short: "Ash", tone: "var(--orange)" },
  san: { name: "Sanya", short: "San", tone: "var(--pink)" },
};

export type Col = "todo" | "ash" | "san" | "done";
export const COLS: { id: Col; title: string; tone: string }[] = [
  { id: "todo", title: "Tasks", tone: "var(--sun)" },
  { id: "ash", title: "Ash is on it", tone: "var(--orange)" },
  { id: "san", title: "San is on it", tone: "var(--pink)" },
  { id: "done", title: "Done", tone: "var(--lilac)" },
];

export type Priority = "low" | "med" | "fire";
export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "low", label: "chill" },
  { id: "med", label: "normal" },
  { id: "fire", label: "on fire" },
];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  col: Col;
  assignee: Who | null;
  priority: Priority;
  labels: string[];
  due: string | null; // YYYY-MM-DD
  checklist: ChecklistItem[];
  position: number;
  created_by: Who;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  comment_count: number;
}

export interface Comment {
  id: string;
  task_id: string;
  author: Who;
  body: string;
  created_at: string;
}

export interface Activity {
  id: string;
  actor: Who;
  verb: string;
  target_type: "task" | "diary" | "dump" | "decision" | "weekly";
  target_id: string | null;
  summary: string;
  created_at: string;
}

export type Mood = "great" | "okay" | "rough";
export interface DiaryEntry {
  id: string;
  author: Who;
  entry_date: string; // YYYY-MM-DD
  body: string;
  mood: Mood | null;
  created_at: string;
  updated_at: string;
}

export type DumpColor = "sun" | "pink" | "orange" | "lilac" | "paper";
export interface DumpItem {
  id: string;
  author: Who;
  body: string;
  url: string | null;
  tags: string[];
  color: DumpColor;
  pinned: boolean;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DecisionStatus = "proposed" | "decided" | "revisit";
export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  why: string;
  status: DecisionStatus;
  author: Who;
  decided_on: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface Weekly {
  week: string; // Monday, YYYY-MM-DD
  person: Who;
  wins: string;
  blockers: string;
  next: string;
  updated_at: string;
}

export interface Pulse {
  rev: number;
  presence: { who: Who; page: string; seen_at: string }[];
  latest: Activity | null;
}
