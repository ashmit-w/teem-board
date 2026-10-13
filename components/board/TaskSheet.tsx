"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import * as I from "../icons";
import { Rich } from "../Rich";
import { api, useLive, useMutate, usePulse } from "../live";
import { COLS, PEOPLE, PRIORITIES, type Activity, type ChecklistItem, type Comment, type Task } from "@/lib/types";
import { prettyDay, timeAgo, uid } from "@/lib/util";

type Props = {
  task: Task;
  allLabels: string[];
  onClose: () => void;
  onPatch: (patch: Partial<Task>) => Promise<void>;
  onDelete: () => void;
};

export function TaskSheet({ task, allLabels, onClose, onPatch, onDelete }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { me } = usePulse();
  const mutate = useMutate();

  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [editingDesc, setEditingDesc] = useState(!task.description);
  const [newLabel, setNewLabel] = useState("");
  const [newItem, setNewItem] = useState("");
  const [comment, setComment] = useState("");

  const comments = useLive<Comment[]>(`/api/tasks/${task.id}/comments`, []);
  const history = useLive<Activity[]>(`/api/activity?task=${task.id}&limit=30`, []);

  // Pick up the other founder's edits unless I'm mid-edit.
  const focused = useRef<string | null>(null);
  useEffect(() => {
    if (focused.current !== "title") setTitle(task.title);
    if (focused.current !== "desc") setDesc(task.description);
  }, [task.title, task.description]);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const saveTitle = () => {
    focused.current = null;
    const t = title.trim();
    if (!t) return setTitle(task.title);
    if (t !== task.title) onPatch({ title: t });
  };
  const saveDesc = () => {
    focused.current = null;
    if (desc !== task.description) onPatch({ description: desc });
    if (desc.trim()) setEditingDesc(false);
  };

  const setChecklist = (checklist: ChecklistItem[]) => onPatch({ checklist });
  const addLabel = (raw: string) => {
    const l = raw.trim().replace(/^#/, "").toLowerCase();
    setNewLabel("");
    if (l && !task.labels.includes(l)) onPatch({ labels: [...task.labels, l] });
  };

  async function postComment(e?: React.FormEvent) {
    e?.preventDefault();
    const body = comment.trim();
    if (!body) return;
    setComment("");
    const c = await mutate(() => api<Comment>("POST", `/api/tasks/${task.id}/comments`, { body }));
    if (c) comments.setData((cs) => [...cs.filter((x) => x.id !== c.id), c]);
  }

  const ticked = task.checklist.filter((c) => c.done).length;

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="drawer-inner">
        <div className="drawer-head">
          <label htmlFor="sheet-title" className="sr-only">
            Title
          </label>
          <input
            id="sheet-title"
            className="title-input"
            value={title}
            maxLength={300}
            onFocus={() => (focused.current = "title")}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
          <button className="icon-btn" aria-label="Close" autoFocus onClick={() => ref.current?.close()}>
            <I.X />
          </button>
        </div>

        <div className="drawer-body">
          <div className="props">
            <span className="k">Where</span>
            <div className="seg" role="group" aria-label="Column">
              {COLS.map((c) => (
                <button key={c.id} aria-pressed={task.col === c.id} onClick={() => task.col !== c.id && onPatch({ col: c.id })}>
                  {c.title}
                </button>
              ))}
            </div>

            <span className="k">Priority</span>
            <div className="seg" role="group" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button key={p.id} aria-pressed={task.priority === p.id} onClick={() => onPatch({ priority: p.id })}>
                  {p.id === "fire" && <I.Flame size={13} />} {p.label}
                </button>
              ))}
            </div>

            <label className="k" htmlFor="due">
              Due
            </label>
            <div className="row">
              <input id="due" type="date" className="field" style={{ width: "auto" }} value={task.due ?? ""} onChange={(e) => onPatch({ due: e.target.value || null })} />
              {task.due && (
                <>
                  <span className="muted tiny">{prettyDay(task.due)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => onPatch({ due: null })}>
                    clear
                  </button>
                </>
              )}
            </div>

            <label className="k" htmlFor="new-label">
              Labels
            </label>
            <div className="row wrap">
              {task.labels.map((l) => (
                <span key={l} className="chip chip-sun">
                  #{l}
                  <button
                    className="icon-btn"
                    style={{ width: 22, height: 22 }}
                    aria-label={`Remove label ${l}`}
                    onClick={() => onPatch({ labels: task.labels.filter((x) => x !== l) })}
                  >
                    <I.X size={12} />
                  </button>
                </span>
              ))}
              <input
                id="new-label"
                className="field"
                style={{ width: 150, minHeight: 36, padding: "4px 12px", borderRadius: 999 }}
                placeholder="+ label"
                list="label-options"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addLabel(newLabel);
                  }
                }}
                onBlur={() => newLabel && addLabel(newLabel)}
              />
              <datalist id="label-options">
                {allLabels.filter((l) => !task.labels.includes(l)).map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <span className="k">People</span>
            <span className="row tiny muted">
              <Avatar who={task.created_by} /> added by {PEOPLE[task.created_by].short} · {timeAgo(task.created_at)}
              {task.assignee && (
                <>
                  {" "}· <Avatar who={task.assignee} /> {task.col === "done" ? "done by" : "with"} {PEOPLE[task.assignee].short}
                </>
              )}
            </span>
          </div>

          <section>
            <div className="section-title">
              Notes
              {!editingDesc && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingDesc(true)}>
                  <I.Edit size={14} /> edit
                </button>
              )}
            </div>
            {editingDesc ? (
              <textarea
                className="field"
                rows={6}
                autoFocus={!!task.description}
                placeholder="Details, links, context… (- bullets, **bold**, #tags)"
                value={desc}
                onFocus={() => (focused.current = "desc")}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={saveDesc}
              />
            ) : (
              <div className="sheet" style={{ padding: "12px 14px", borderRadius: 14, boxShadow: "none" }} onDoubleClick={() => setEditingDesc(true)}>
                <Rich text={task.description} />
              </div>
            )}
          </section>

          <section>
            <div className="section-title">
              <I.ListCheck /> Checklist
              {task.checklist.length > 0 && (
                <span className="muted tiny">
                  {ticked}/{task.checklist.length}
                </span>
              )}
            </div>
            {task.checklist.length > 0 && (
              <div className="progress" style={{ marginBottom: 8 }} aria-hidden="true">
                <span style={{ width: `${(ticked / task.checklist.length) * 100}%` }} />
              </div>
            )}
            {task.checklist.map((item) => (
              <div key={item.id} className={`check-item${item.done ? " done" : ""}`}>
                <input
                  id={`ci-${item.id}`}
                  type="checkbox"
                  checked={item.done}
                  onChange={() => setChecklist(task.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)))}
                />
                <label htmlFor={`ci-${item.id}`} className="grow">
                  {item.text}
                </label>
                <button className="icon-btn" aria-label={`Remove ${item.text}`} onClick={() => setChecklist(task.checklist.filter((c) => c.id !== item.id))}>
                  <I.X size={14} />
                </button>
              </div>
            ))}
            <form
              className="row"
              style={{ marginTop: 6 }}
              onSubmit={(e) => {
                e.preventDefault();
                const text = newItem.trim();
                if (!text) return;
                setNewItem("");
                setChecklist([...task.checklist, { id: uid(), text, done: false }]);
              }}
            >
              <label htmlFor="new-item" className="sr-only">
                New checklist item
              </label>
              <input id="new-item" className="field" placeholder="Add a step…" value={newItem} onChange={(e) => setNewItem(e.target.value)} maxLength={300} />
              <button className="btn btn-sm" aria-label="Add step">
                <I.Plus size={16} />
              </button>
            </form>
          </section>

          <section>
            <div className="section-title">
              <I.Bubble /> Comments
            </div>
            <div className="stack">
              {comments.data.map((c) => (
                <div key={c.id} className={`comment${c.author === me ? " mine" : ""}`}>
                  <Avatar who={c.author} />
                  <div className="bubble">
                    <div className="tiny muted" style={{ marginBottom: 2 }}>
                      <strong>{PEOPLE[c.author].short}</strong> · {timeAgo(c.created_at)}
                    </div>
                    <Rich text={c.body} />
                  </div>
                </div>
              ))}
              {!comments.loading && comments.data.length === 0 && <p className="muted tiny" style={{ margin: 0 }}>No comments yet.</p>}
            </div>
            <form onSubmit={postComment} className="stack" style={{ marginTop: 12, gap: 8 }}>
              <label htmlFor="comment" className="sr-only">
                Comment
              </label>
              <textarea
                id="comment"
                className="field"
                rows={2}
                placeholder={`Say something to ${PEOPLE[me === "ash" ? "san" : "ash"].short}… (⌘/Ctrl + Enter)`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && postComment()}
              />
              <div>
                <button className="btn btn-sun btn-sm" disabled={!comment.trim()}>
                  Post
                </button>
              </div>
            </form>
          </section>

          {history.data.length > 0 && (
            <section>
              <div className="section-title">
                <I.Pulse /> History
              </div>
              <ul className="history" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {history.data.map((a) => (
                  <li key={a.id}>
                    <strong>{PEOPLE[a.actor].short}</strong> {a.summary} · {timeAgo(a.created_at)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div style={{ marginTop: "auto", paddingTop: 12 }}>
            <button
              className="btn btn-sm"
              onClick={() => {
                if (confirm(`Delete “${task.title}”? This can't be undone.`)) onDelete();
              }}
            >
              <I.Trash size={16} /> Delete task
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
