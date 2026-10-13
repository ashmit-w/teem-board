"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { CardFace, SortableCard } from "./Card";
import { TaskSheet } from "./TaskSheet";
import * as I from "../icons";
import { Squiggle } from "../Logo";
import { api, useLive, useMutate, usePulse } from "../live";
import { COLS, PEOPLE, type Col, type Task, type Who } from "@/lib/types";
import { weekOf } from "@/lib/util";

type Grouped = Record<Col, string[]>;
const COL_IDS = COLS.map((c) => c.id);
const DONE_PREVIEW = 20;

function group(tasks: Task[]): Grouped {
  const g: Grouped = { todo: [], ash: [], san: [], done: [] };
  for (const t of [...tasks].sort((a, b) => a.position - b.position)) g[t.col].push(t.id);
  return g;
}

/** Position for a card dropped between two neighbours (fractional indexing). */
export function between(prev?: Task, next?: Task) {
  if (prev && next) return (prev.position + next.position) / 2;
  if (prev) return prev.position + 1024;
  if (next) return next.position - 1024;
  return 0;
}

function QuickAdd({ col, onAdd, autoFocus }: { col: Col; onAdd: (title: string, col: Col) => Promise<unknown>; autoFocus?: boolean }) {
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <form
      className="quick-add"
      onSubmit={async (e) => {
        e.preventDefault();
        const t = title.trim();
        if (!t) return;
        setTitle("");
        await onAdd(t, col);
        ref.current?.focus();
      }}
    >
      <label className="sr-only" htmlFor={`add-${col}`}>
        New task
      </label>
      <input
        ref={ref}
        id={`add-${col}`}
        className="field"
        placeholder={col === "todo" ? "Jot a task, hit enter…" : `Add straight to ${COLS.find((c) => c.id === col)!.title}…`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus={autoFocus}
        maxLength={300}
      />
    </form>
  );
}

function Column({
  col,
  ids,
  byId,
  onOpen,
  onAdd,
  total,
}: {
  col: (typeof COLS)[number];
  ids: string[];
  byId: Map<string, Task>;
  onOpen: (id: string) => void;
  onAdd: (title: string, col: Col) => Promise<unknown>;
  total: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visible = col.id === "done" && !showAll ? ids.slice(0, DONE_PREVIEW) : ids;
  const empty: Record<Col, string> = {
    todo: "Nothing waiting. Suspicious.",
    ash: "Drag a task here when Ash grabs it",
    san: "Drag a task here when San grabs it",
    done: "Finished things land here",
  };
  return (
    <section className={`column${isOver ? " over" : ""}`} aria-labelledby={`col-${col.id}`}>
      <div className="col-head">
        <h2 id={`col-${col.id}`} className="col-title" style={{ background: col.tone }}>
          {col.title}
        </h2>
        <span className="count" aria-label={`${total} tasks`}>
          {total}
        </span>
        {col.id !== "todo" && col.id !== "done" && (
          <button
            className={`icon-btn${adding ? " on" : ""}`}
            style={{ marginLeft: "auto" }}
            aria-label={`Add to ${col.title}`}
            aria-expanded={adding}
            onClick={() => setAdding((a) => !a)}
          >
            <I.Plus />
          </button>
        )}
      </div>
      {(col.id === "todo" || adding) && <QuickAdd col={col.id} onAdd={onAdd} autoFocus={adding} />}
      <SortableContext id={col.id} items={visible} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="col-body">
          {visible.map((id) => {
            const t = byId.get(id);
            return t ? <SortableCard key={id} task={t} onOpen={() => onOpen(id)} /> : null;
          })}
          {ids.length === 0 && <div className="col-empty">{empty[col.id]}</div>}
        </div>
      </SortableContext>
      {col.id === "done" && ids.length > DONE_PREVIEW && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show fewer" : `Show ${ids.length - DONE_PREVIEW} older`}
        </button>
      )}
    </section>
  );
}

export function Board() {
  const { me, notify } = usePulse();
  const mutate = useMutate();
  const live = useLive<Task[]>("/api/tasks", []);
  const tasks = live.data;
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const [q, setQ] = useState("");
  const [person, setPerson] = useState<Who | "all">("all");
  const [label, setLabel] = useState("");
  const [fireOnly, setFireOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allLabels = useMemo(() => [...new Set(tasks.flatMap((t) => t.labels))].sort(), [tasks]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!needle || t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle) || t.labels.some((l) => l.includes(needle))) &&
        (person === "all" || t.assignee === person || (t.col === "todo" && !t.assignee)) &&
        (!label || t.labels.includes(label)) &&
        (!fireOnly || t.priority === "fire"),
    );
  }, [tasks, q, person, label, fireOnly]);

  // Local column order; follows server data except mid-drag.
  const [cols, setCols] = useState<Grouped>(() => group(filtered));
  useEffect(() => {
    if (!activeId) setCols(group(filtered));
  }, [filtered, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const colOf = (id: string): Col | undefined =>
    (COL_IDS as string[]).includes(id) ? (id as Col) : COL_IDS.find((c) => cols[c].includes(id));

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = colOf(String(active.id));
    const to = colOf(String(over.id));
    if (!from || !to || from === to) return;
    setCols((prev) => {
      const toItems = [...prev[to]];
      const overIndex = toItems.indexOf(String(over.id));
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, String(active.id));
      return { ...prev, [from]: prev[from].filter((x) => x !== active.id), [to]: toItems };
    });
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const col = colOf(id);
    const task = byId.get(id);
    if (!over || !col || !task) {
      setActiveId(null);
      return;
    }
    let items = cols[col];
    const oldI = items.indexOf(id);
    const newI = items.indexOf(String(over.id));
    if (newI >= 0 && oldI !== newI) items = arrayMove(items, oldI, newI);
    const i = items.indexOf(id);
    const position = between(byId.get(items[i - 1]), byId.get(items[i + 1]));

    setCols((prev) => ({ ...prev, [col]: items }));
    setActiveId(null);
    if (task.col === col && task.position === position) return;

    live.setData((d) =>
      d.map((t) =>
        t.id === id
          ? { ...t, col, position, assignee: col === "ash" || col === "san" ? col : col === "done" ? (t.assignee ?? me) : t.assignee }
          : t,
      ),
    );
    await mutate(
      () => api<Task>("PATCH", `/api/tasks/${id}`, { col, position }),
      () => live.reload(),
    );
  }

  async function addTask(title: string, col: Col) {
    const created = await mutate(() => api<Task>("POST", "/api/tasks", { title, col }));
    if (created) live.setData((d) => [...d.filter((t) => t.id !== created.id), created]);
  }

  async function patchTask(id: string, patch: Partial<Task>) {
    const cur = byId.get(id);
    if (!cur) return;
    // Moving via the drawer puts the card on top of the target column.
    if (patch.col && patch.col !== cur.col && patch.position === undefined) {
      const top = tasks.filter((t) => t.col === patch.col).reduce((m, t) => Math.min(m, t.position), Infinity);
      patch = { ...patch, position: top === Infinity ? 0 : top - 1024 };
    }
    live.setData((d) => d.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const updated = await mutate(() => api<Task>("PATCH", `/api/tasks/${id}`, patch), () => live.reload());
    if (updated) live.setData((d) => d.map((t) => (t.id === id ? updated : t)));
  }

  async function deleteTask(id: string) {
    setOpenId(null);
    live.setData((d) => d.filter((t) => t.id !== id));
    await mutate(() => api("DELETE", `/api/tasks/${id}`), () => live.reload());
    notify("Task deleted");
  }

  const week = weekOf();
  const doneThisWeek = tasks.filter((t) => t.col === "done" && t.completed_at && weekOf(new Date(t.completed_at)) === week);
  const onFire = tasks.filter((t) => t.priority === "fire" && t.col !== "done").length;
  const open = openId ? byId.get(openId) : undefined;
  const active = activeId ? byId.get(activeId) : undefined;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>The board</h1>
          <Squiggle className="title-squig" />
        </div>
        <div className="stats" aria-label="This week">
          {onFire > 0 && (
            <span className="chip chip-pink">
              <I.Flame size={13} /> {onFire} on fire
            </span>
          )}
          <span className="chip chip-sun">{tasks.filter((t) => t.col !== "done").length} open</span>
          {(["ash", "san"] as Who[]).map((w) => (
            <span key={w} className="chip chip-lilac">
              {PEOPLE[w].short} shipped {doneThisWeek.filter((t) => t.assignee === w).length} this week
            </span>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <I.Search />
          <label className="sr-only" htmlFor="board-search">
            Search tasks
          </label>
          <input id="board-search" className="field" placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg" role="group" aria-label="Filter by person">
          {(["all", "ash", "san"] as const).map((p) => (
            <button key={p} aria-pressed={person === p} onClick={() => setPerson(p)}>
              {p === "all" ? "Everyone" : PEOPLE[p].short}
            </button>
          ))}
        </div>
        <button className="chip" aria-pressed={fireOnly} onClick={() => setFireOnly((f) => !f)}>
          <I.Flame size={13} /> on fire only
        </button>
        {allLabels.length > 0 && (
          <>
            <label className="sr-only" htmlFor="label-filter">
              Filter by label
            </label>
            <select id="label-filter" className="field" style={{ width: "auto", borderRadius: 999 }} value={label} onChange={(e) => setLabel(e.target.value)}>
              <option value="">All labels</option>
              {allLabels.map((l) => (
                <option key={l} value={l}>
                  #{l}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {live.loading ? (
        <p className="muted">Opening the board…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="board">
            {COLS.map((c) => (
              <Column key={c.id} col={c} ids={cols[c.id]} byId={byId} onOpen={setOpenId} onAdd={addTask} total={cols[c.id].length} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {active ? (
              <article className={`card overlay${active.col === "done" ? " done" : ""}`}>
                <CardFace task={active} overlay />
              </article>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {open && <TaskSheet task={open} allLabels={allLabels} onClose={() => setOpenId(null)} onPatch={(p) => patchTask(open.id, p)} onDelete={() => deleteTask(open.id)} />}
    </main>
  );
}
