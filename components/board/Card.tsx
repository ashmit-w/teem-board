"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "../Avatar";
import * as I from "../icons";
import type { Task } from "@/lib/types";
import { isoDay, prettyDay, tilt } from "@/lib/util";

export function CardFace({ task, onOpen, overlay = false }: { task: Task; onOpen?: () => void; overlay?: boolean }) {
  const done = task.col === "done";
  const total = task.checklist.length;
  const ticked = task.checklist.filter((c) => c.done).length;
  const overdue = !done && task.due && task.due < isoDay();
  return (
    <>
      {(task.priority !== "med" || task.labels.length > 0) && (
        <div className="card-tags">
          {task.priority === "fire" && (
            <span className="chip chip-pink">
              <I.Flame size={13} /> on fire
            </span>
          )}
          {task.priority === "low" && <span className="chip chip-lilac">chill</span>}
          {task.labels.map((l) => (
            <span key={l} className="chip chip-sun">
              #{l}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        className="card-title"
        onClick={onOpen}
        tabIndex={overlay ? -1 : 0}
        // Enter/Space should open the card, not start a keyboard drag on the parent.
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && e.stopPropagation()}
      >
        {task.title}
      </button>
      <div className="card-meta">
        {task.due && (
          <span className={`row${overdue ? " overdue" : ""}`} title={`Due ${task.due}`}>
            <I.Calendar size={14} />
            {prettyDay(task.due)}
          </span>
        )}
        {total > 0 && (
          <span className="row" title="Checklist">
            <I.ListCheck size={14} />
            {ticked}/{total}
          </span>
        )}
        {task.comment_count > 0 && (
          <span className="row" title="Comments">
            <I.Bubble size={14} />
            {task.comment_count}
          </span>
        )}
        {done && (
          <span className="row" title="Done">
            <I.Check size={14} />
          </span>
        )}
        {task.assignee && <Avatar who={task.assignee} />}
      </div>
    </>
  );
}

export function SortableCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    "--tilt": `${tilt(task.id)}deg`,
  } as React.CSSProperties;
  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`card${isDragging ? " dragging" : ""}${task.priority === "fire" && task.col !== "done" ? " fire" : ""}${task.col === "done" ? " done" : ""}`}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable task"
      aria-label={`Move “${task.title}”`}
    >
      <CardFace task={task} onOpen={onOpen} />
    </article>
  );
}
