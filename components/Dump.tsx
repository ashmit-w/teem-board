"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import * as I from "./icons";
import { Squiggle } from "./Logo";
import { Rich } from "./Rich";
import { api, useLive, useMutate, usePulse } from "./live";
import { PEOPLE, type DumpColor, type DumpItem, type Task, type Who } from "@/lib/types";
import { hostOf, tilt, timeAgo } from "@/lib/util";

const COLORS: { id: DumpColor; fill: string; label: string }[] = [
  { id: "sun", fill: "#fff0a8", label: "Yellow" },
  { id: "pink", fill: "#ffd0dc", label: "Pink" },
  { id: "orange", fill: "#ffdcb9", label: "Orange" },
  { id: "lilac", fill: "#e6defc", label: "Lilac" },
  { id: "paper", fill: "#ffffff", label: "White" },
];

function Swatches({ value, onChange }: { value: DumpColor; onChange: (c: DumpColor) => void }) {
  return (
    <div className="swatches" role="group" aria-label="Note colour">
      {COLORS.map((c) => (
        <button key={c.id} type="button" className="swatch" style={{ background: c.fill }} aria-pressed={value === c.id} aria-label={c.label} onClick={() => onChange(c.id)} />
      ))}
    </div>
  );
}

function Sticky({ item, onPatch, onDelete, onTask }: { item: DumpItem; onPatch: (p: Partial<DumpItem>) => Promise<void>; onDelete: () => void; onTask: () => void }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(item.body);
  // The url and #tags already render as chips below, so keep the note text clean.
  const display = item.url && item.body.trim() === item.url ? "" : item.body;
  return (
    <article className={`sticky ${item.color}`} style={{ "--tilt": `${tilt(item.id, 1.6)}deg` } as React.CSSProperties}>
      {item.pinned && (
        <span className="pin-mark" title="Pinned">
          <I.Pin size={16} />
        </span>
      )}
      {editing ? (
        <div className="stack" style={{ gap: 8 }}>
          <label className="sr-only" htmlFor={`dump-${item.id}`}>
            Edit note
          </label>
          <textarea id={`dump-${item.id}`} className="field" rows={5} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
          <div className="row">
            <Swatches value={item.color} onChange={(color) => onPatch({ color })} />
            <span className="grow" />
            <button className="btn btn-ghost btn-sm" onClick={() => (setEditing(false), setBody(item.body))}>
              Cancel
            </button>
            <button
              className="btn btn-sm"
              disabled={!body.trim()}
              onClick={async () => {
                await onPatch({ body });
                setEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {display && <Rich text={display} />}
          {item.url && (
            <a className="link-chip" href={item.url} target="_blank" rel="noreferrer noopener">
              <I.LinkIcon size={14} /> {hostOf(item.url)}
            </a>
          )}
        </>
      )}
      <div className="sticky-foot">
        <Avatar who={item.author} />
        <span className="tiny muted grow">{timeAgo(item.created_at)}</span>
        {item.task_id ? (
          <Link href="/" className="chip chip-ink" title="Already a task on the board">
            on board
          </Link>
        ) : (
          <button className="icon-btn" aria-label="Turn into a task" title="Turn into a task" onClick={onTask}>
            <I.ArrowRight size={16} />
          </button>
        )}
        <button className={`icon-btn${item.pinned ? " on" : ""}`} aria-label={item.pinned ? "Unpin" : "Pin to top"} title={item.pinned ? "Unpin" : "Pin to top"} onClick={() => onPatch({ pinned: !item.pinned })}>
          <I.Pin size={16} />
        </button>
        <button className="icon-btn" aria-label="Edit" title="Edit" onClick={() => setEditing(true)}>
          <I.Edit size={16} />
        </button>
        <button className="icon-btn" aria-label="Delete" title="Delete" onClick={() => confirm("Toss this note?") && onDelete()}>
          <I.Trash size={16} />
        </button>
      </div>
    </article>
  );
}

export function Dump() {
  const { notify } = usePulse();
  const mutate = useMutate();
  const live = useLive<DumpItem[]>("/api/dump", []);
  const [body, setBody] = useState("");
  const [color, setColor] = useState<DumpColor>("sun");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [author, setAuthor] = useState<Who | "all">("all");

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of live.data) for (const t of it.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [live.data]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return live.data.filter(
      (it) =>
        (!tag || it.tags.includes(tag)) &&
        (author === "all" || it.author === author) &&
        (!needle || it.body.toLowerCase().includes(needle)),
    );
  }, [live.data, q, tag, author]);

  async function add(e?: React.FormEvent) {
    e?.preventDefault();
    if (!body.trim()) return;
    const created = await mutate(() => api<DumpItem>("POST", "/api/dump", { body, color }));
    if (created) {
      live.setData((d) => [created, ...d]);
      setBody("");
    }
  }

  const patch = async (id: string, p: Partial<DumpItem>) => {
    live.setData((d) => d.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const u = await mutate(() => api<DumpItem>("PATCH", `/api/dump/${id}`, p), live.reload);
    if (u) live.setData((d) => d.map((x) => (x.id === id ? u : x)));
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Info dump</h1>
          <Squiggle className="title-squig" />
          <p className="sub">Links, ideas, half-thoughts, &ldquo;remember this&rdquo;. Tag with #hashtags; turn anything into a task.</p>
        </div>
      </div>

      <form className={`sticky ${color}`} style={{ maxWidth: 640, transform: "rotate(-0.6deg)", marginBottom: 30 }} onSubmit={add}>
        <label className="sr-only" htmlFor="dump-new">
          New note
        </label>
        <textarea
          id="dump-new"
          className="field"
          rows={3}
          style={{ background: "rgba(255,255,255,.7)" }}
          placeholder="Dump it here… paste a link, an idea, a #investor name… (⌘/Ctrl + Enter)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && add()}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <Swatches value={color} onChange={setColor} />
          <span className="grow" />
          <button className="btn btn-sun" disabled={!body.trim()}>
            <I.Plus size={16} /> Dump it
          </button>
        </div>
      </form>

      <div className="toolbar">
        <div className="search">
          <I.Search />
          <label className="sr-only" htmlFor="dump-search">
            Search the dump
          </label>
          <input id="dump-search" className="field" placeholder="Search the dump…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg" role="group" aria-label="Filter by author">
          {(["all", "ash", "san"] as const).map((p) => (
            <button key={p} aria-pressed={author === p} onClick={() => setAuthor(p)}>
              {p === "all" ? "Both" : PEOPLE[p].short}
            </button>
          ))}
        </div>
      </div>
      {tagCounts.length > 0 && (
        <div className="row wrap" style={{ marginBottom: 24 }} role="group" aria-label="Filter by tag">
          <button className="chip" aria-pressed={!tag} onClick={() => setTag("")}>
            all
          </button>
          {tagCounts.map(([t, n]) => (
            <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}>
              #{t} <span className="muted">{n}</span>
            </button>
          ))}
        </div>
      )}

      {live.loading && <p className="muted">Rummaging…</p>}
      {!live.loading && items.length === 0 && <p className="muted">{live.data.length ? "Nothing matches." : "Empty. Dump your first thought above."}</p>}
      <div className="dump-grid">
        {items.map((it) => (
          <Sticky
            key={`${it.id}-${it.updated_at}`}
            item={it}
            onPatch={(p) => patch(it.id, p)}
            onDelete={async () => {
              live.setData((d) => d.filter((x) => x.id !== it.id));
              await mutate(() => api("DELETE", `/api/dump/${it.id}`), live.reload);
            }}
            onTask={async () => {
              const t = await mutate(() => api<Task>("POST", `/api/dump/${it.id}/task`));
              if (t) {
                live.setData((d) => d.map((x) => (x.id === it.id ? { ...x, task_id: t.id } : x)));
                notify(`Added “${t.title}” to Tasks`);
              }
            }}
          />
        ))}
      </div>
    </main>
  );
}
