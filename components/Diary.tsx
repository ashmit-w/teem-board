"use client";

import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import * as I from "./icons";
import { Squiggle } from "./Logo";
import { Rich } from "./Rich";
import { api, useLive, useMutate, usePulse } from "./live";
import { PEOPLE, type DiaryEntry, type Mood, type Who } from "@/lib/types";
import { clock, isoDay, prettyDay } from "@/lib/util";

const MOODS: { id: Mood; label: string; Icon: typeof I.Sun }[] = [
  { id: "great", label: "great day", Icon: I.Sun },
  { id: "okay", label: "okay day", Icon: I.Cloud },
  { id: "rough", label: "rough day", Icon: I.Rain },
];

function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (m: Mood | null) => void }) {
  return (
    <div className="seg" role="group" aria-label="Mood">
      {MOODS.map(({ id, label, Icon }) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(value === id ? null : id)} title={label}>
          <Icon size={16} /> {id}
        </button>
      ))}
    </div>
  );
}

function Entry({ e, mine, onSave, onDelete }: { e: DiaryEntry; mine: boolean; onSave: (patch: Partial<DiaryEntry>) => Promise<void>; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(e.body);
  const [mood, setMood] = useState<Mood | null>(e.mood);
  const MoodIcon = MOODS.find((m) => m.id === e.mood)?.Icon;
  return (
    <article className="sheet lined entry">
      <div className="entry-head">
        <Avatar who={e.author} />
        <strong>{PEOPLE[e.author].short}</strong>
        <span className="muted tiny">{clock(e.created_at)}</span>
        {MoodIcon && (
          <span className="chip chip-sun" title={`${e.mood} day`}>
            <MoodIcon size={13} /> {e.mood}
          </span>
        )}
        {mine && !editing && (
          <div className="entry-actions">
            <button className="icon-btn" aria-label="Edit entry" onClick={() => setEditing(true)}>
              <I.Edit size={16} />
            </button>
            <button className="icon-btn" aria-label="Delete entry" onClick={() => confirm("Delete this diary entry?") && onDelete()}>
              <I.Trash size={16} />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="stack" style={{ gap: 8 }}>
          <label className="sr-only" htmlFor={`edit-${e.id}`}>
            Entry
          </label>
          <textarea id={`edit-${e.id}`} className="field" rows={6} value={body} onChange={(ev) => setBody(ev.target.value)} autoFocus />
          <div className="row wrap">
            <MoodPicker value={mood} onChange={setMood} />
            <span className="grow" />
            <button className="btn btn-ghost btn-sm" onClick={() => (setEditing(false), setBody(e.body), setMood(e.mood))}>
              Cancel
            </button>
            <button
              className="btn btn-sun btn-sm"
              disabled={!body.trim()}
              onClick={async () => {
                await onSave({ body, mood });
                setEditing(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <Rich text={e.body} className="entry-body" />
      )}
    </article>
  );
}

export function Diary() {
  const { me } = usePulse();
  const mutate = useMutate();
  const live = useLive<DiaryEntry[]>("/api/diary", []);
  const [body, setBody] = useState("");
  const [date, setDate] = useState(isoDay());
  const [mood, setMood] = useState<Mood | null>(null);
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState<Who | "all">("all");

  const days = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map<string, DiaryEntry[]>();
    for (const e of live.data) {
      if (author !== "all" && e.author !== author) continue;
      if (needle && !e.body.toLowerCase().includes(needle)) continue;
      map.set(e.entry_date, [...(map.get(e.entry_date) ?? []), e]);
    }
    return [...map.entries()].map(([d, es]) => [d, es.sort((a, b) => a.created_at.localeCompare(b.created_at))] as const);
  }, [live.data, q, author]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!body.trim()) return;
    const created = await mutate(() => api<DiaryEntry>("POST", "/api/diary", { body, entry_date: date, mood }));
    if (created) {
      live.setData((d) => [created, ...d]);
      setBody("");
      setMood(null);
    }
  }

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Our notes diary</h1>
          <Squiggle className="title-squig" />
          <p className="sub">One shared journal. What happened, what we learnt, what's on our minds.</p>
        </div>
      </div>

      <form className="sheet composer stack" onSubmit={save} style={{ gap: 12 }}>
        <div className="row wrap">
          <Avatar who={me} />
          <strong>Dear diary,</strong>
          <span className="grow" />
          <label className="sr-only" htmlFor="entry-date">
            Date
          </label>
          <input id="entry-date" type="date" className="field" style={{ width: "auto" }} value={date} onChange={(e) => setDate(e.target.value || isoDay())} />
        </div>
        <label className="sr-only" htmlFor="entry-body">
          Diary entry
        </label>
        <textarea
          id="entry-body"
          className="field lined"
          rows={5}
          style={{ lineHeight: "30px" }}
          placeholder="Today we… (- bullets, [ ] todos, **bold**, #tags, links all work)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && save()}
        />
        <div className="row wrap">
          <MoodPicker value={mood} onChange={setMood} />
          <span className="grow" />
          <button className="btn btn-sun" disabled={!body.trim()}>
            Add to diary
          </button>
        </div>
      </form>

      <div className="toolbar" style={{ marginTop: 26 }}>
        <div className="search">
          <I.Search />
          <label className="sr-only" htmlFor="diary-search">
            Search the diary
          </label>
          <input id="diary-search" className="field" placeholder="Search the diary…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="seg" role="group" aria-label="Filter by author">
          {(["all", "ash", "san"] as const).map((p) => (
            <button key={p} aria-pressed={author === p} onClick={() => setAuthor(p)}>
              {p === "all" ? "Both of us" : PEOPLE[p].short}
            </button>
          ))}
        </div>
      </div>

      {live.loading && <p className="muted">Flipping pages…</p>}
      {!live.loading && days.length === 0 && <p className="muted">{q ? "Nothing matches that." : "The first page is blank. Write something."}</p>}
      {days.map(([day, entries]) => (
        <section key={day} className="diary-day" aria-label={prettyDay(day)}>
          <h2 className="day-sticker" style={{ fontSize: 16 }}>
            {prettyDay(day)}
          </h2>
          {entries.map((e) => (
            <Entry
              key={`${e.id}-${e.updated_at}`}
              e={e}
              mine={e.author === me}
              onSave={async (patch) => {
                const u = await mutate(() => api<DiaryEntry>("PATCH", `/api/diary/${e.id}`, patch));
                if (u) live.setData((d) => d.map((x) => (x.id === u.id ? u : x)));
              }}
              onDelete={async () => {
                live.setData((d) => d.filter((x) => x.id !== e.id));
                await mutate(() => api("DELETE", `/api/diary/${e.id}`), live.reload);
              }}
            />
          ))}
        </section>
      ))}
    </main>
  );
}
