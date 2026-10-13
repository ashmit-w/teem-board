"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import * as I from "./icons";
import { Squiggle } from "./Logo";
import { Rich } from "./Rich";
import { api, useLive, useMutate } from "./live";
import { PEOPLE, type Decision, type DecisionStatus } from "@/lib/types";
import { isoDay, prettyDay } from "@/lib/util";

const STATUS: { id: DecisionStatus; label: string; chip: string }[] = [
  { id: "proposed", label: "proposed", chip: "chip-sun" },
  { id: "decided", label: "decided", chip: "chip-lilac" },
  { id: "revisit", label: "revisit", chip: "chip-pink" },
];

type Draft = Pick<Decision, "title" | "context" | "decision" | "why" | "status" | "decided_on">;
const blank = (): Draft => ({ title: "", context: "", decision: "", why: "", status: "decided", decided_on: isoDay() });

function DecisionForm({ initial, onCancel, onSave }: { initial: Draft; onCancel: () => void; onSave: (d: Draft) => Promise<void> }) {
  const [d, setD] = useState(initial);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <form
      className="sheet decision stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (d.title.trim()) await onSave(d);
      }}
    >
      <div>
        <label className="label" htmlFor="dec-title">
          What did we decide?
        </label>
        <input id="dec-title" className="field" value={d.title} onChange={set("title")} placeholder="e.g. Build on Vercel + Neon, not Firebase" autoFocus maxLength={300} />
      </div>
      <div className="row wrap" style={{ gap: 16 }}>
        <div className="seg" role="group" aria-label="Status">
          {STATUS.map((s) => (
            <button key={s.id} type="button" aria-pressed={d.status === s.id} onClick={() => setD({ ...d, status: s.id })}>
              {s.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="dec-date">
          Date
        </label>
        <input id="dec-date" type="date" className="field" style={{ width: "auto" }} value={d.decided_on} onChange={set("decided_on")} />
      </div>
      <div className="decision-grid" style={{ marginTop: 0 }}>
        {(
          [
            ["context", "Context", "What was going on?"],
            ["decision", "We decided", "The call we made"],
            ["why", "Why", "Reasons, trade-offs, what we gave up"],
          ] as const
        ).map(([k, label, ph]) => (
          <div key={k}>
            <label className="label" htmlFor={`dec-${k}`}>
              {label}
            </label>
            <textarea id={`dec-${k}`} className="field" rows={4} value={d[k]} onChange={set(k)} placeholder={ph} />
          </div>
        ))}
      </div>
      <div className="row">
        <span className="grow" />
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-sun" disabled={!d.title.trim()}>
          Save decision
        </button>
      </div>
    </form>
  );
}

export function Decisions() {
  const mutate = useMutate();
  const live = useLive<Decision[]>("/api/decisions", []);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<DecisionStatus | "all">("all");
  const list = live.data.filter((d) => filter === "all" || d.status === filter);

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Decisions log</h1>
          <Squiggle className="title-squig" />
          <p className="sub">Write down the big calls and why, so future-us doesn&apos;t re-argue them.</p>
        </div>
        {!adding && (
          <button className="btn btn-sun" onClick={() => setAdding(true)}>
            <I.Plus size={16} /> Log a decision
          </button>
        )}
      </div>

      {adding && (
        <DecisionForm
          initial={blank()}
          onCancel={() => setAdding(false)}
          onSave={async (d) => {
            const created = await mutate(() => api<Decision>("POST", "/api/decisions", d));
            if (created) {
              live.setData((x) => [created, ...x]);
              setAdding(false);
            }
          }}
        />
      )}

      <div className="seg" role="group" aria-label="Filter by status" style={{ margin: "8px 0 18px" }}>
        {(["all", ...STATUS.map((s) => s.id)] as const).map((s) => (
          <button key={s} aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {live.loading && <p className="muted">Loading…</p>}
      {!live.loading && list.length === 0 && <p className="muted">No decisions here yet.</p>}

      {list.map((d) =>
        editing === d.id ? (
          <DecisionForm
            key={d.id}
            initial={d}
            onCancel={() => setEditing(null)}
            onSave={async (draft) => {
              const u = await mutate(() => api<Decision>("PATCH", `/api/decisions/${d.id}`, draft));
              if (u) {
                live.setData((x) => x.map((y) => (y.id === u.id ? u : y)));
                setEditing(null);
              }
            }}
          />
        ) : (
          <article key={d.id} className="sheet decision">
            <div className="row wrap">
              <span className={`chip ${STATUS.find((s) => s.id === d.status)!.chip}`}>{d.status}</span>
              <span className="tiny muted">{prettyDay(d.decided_on)}</span>
              <span className="row tiny muted">
                <Avatar who={d.author} /> {PEOPLE[d.author].short}
              </span>
              <span className="grow" />
              <button className="icon-btn" aria-label="Edit decision" onClick={() => setEditing(d.id)}>
                <I.Edit size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Delete decision"
                onClick={async () => {
                  if (!confirm(`Delete “${d.title}”?`)) return;
                  live.setData((x) => x.filter((y) => y.id !== d.id));
                  await mutate(() => api("DELETE", `/api/decisions/${d.id}`), live.reload);
                }}
              >
                <I.Trash size={16} />
              </button>
            </div>
            <h2 style={{ fontSize: 22, marginTop: 10 }}>{d.title}</h2>
            {(d.context || d.decision || d.why) && (
              <div className="decision-grid">
                {(
                  [
                    ["Context", d.context],
                    ["We decided", d.decision],
                    ["Why", d.why],
                  ] as const
                ).map(([h, v]) =>
                  v ? (
                    <div key={h}>
                      <h4>{h}</h4>
                      <Rich text={v} />
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </article>
        ),
      )}
    </main>
  );
}
