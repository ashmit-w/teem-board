"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import * as I from "./icons";
import { Squiggle } from "./Logo";
import { Rich } from "./Rich";
import { api, useLive, usePulse } from "./live";
import { PEOPLE, WHO, type Task, type Weekly, type Who } from "@/lib/types";
import { addDays, shortDay, weekOf } from "@/lib/util";

type WeekData = { week: string; entries: Weekly[]; weeks: string[] };
type Fields = Pick<Weekly, "wins" | "blockers" | "next">;
const SECTIONS: { k: keyof Fields; title: string; Icon: typeof I.Sun; ph: string }[] = [
  { k: "wins", title: "Wins", Icon: I.Sparkle, ph: "What went well this week?" },
  { k: "blockers", title: "Blockers", Icon: I.Rain, ph: "What's stuck? What do you need from the other?" },
  { k: "next", title: "Next week", Icon: I.ArrowRight, ph: "What are you taking on?" },
];

function MyCard({ week, entry }: { week: string; entry?: Weekly }) {
  const { me, notify, refresh } = usePulse();
  const [f, setF] = useState<Fields>({ wins: entry?.wins ?? "", blockers: entry?.blockers ?? "", next: entry?.next ?? "" });
  const [state, setState] = useState<"saved" | "typing" | "saving">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(f);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const save = async () => {
    setState("saving");
    try {
      await api("PUT", "/api/weekly", { week, ...latest.current });
      setState("saved");
      refresh();
    } catch (e) {
      setState("typing");
      notify(e instanceof Error ? e.message : "Couldn't save", { error: true });
    }
  };

  const change = (k: keyof Fields, v: string) => {
    const next = { ...latest.current, [k]: v };
    latest.current = next;
    setF(next);
    setState("typing");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 900);
  };

  return (
    <article className="sheet week-card">
      <div className="row">
        <Avatar who={me} large />
        <h2>{PEOPLE[me].short} (you)</h2>
        <span className="grow" />
        <span className="tiny muted" aria-live="polite">
          {state === "saved" ? "saved" : state === "saving" ? "saving…" : "editing…"}
        </span>
      </div>
      {SECTIONS.map(({ k, title, Icon, ph }) => (
        <div key={k} className="week-section">
          <h3>
            <Icon size={17} />
            <label htmlFor={`wk-${k}`}>{title}</label>
          </h3>
          <textarea id={`wk-${k}`} className="field" rows={4} placeholder={ph} value={f[k]} onChange={(e) => change(k, e.target.value)} onBlur={() => state === "typing" && save()} />
        </div>
      ))}
    </article>
  );
}

function TheirCard({ who, entry }: { who: Who; entry?: Weekly }) {
  return (
    <article className="sheet week-card">
      <div className="row">
        <Avatar who={who} large />
        <h2>{PEOPLE[who].short}</h2>
      </div>
      {SECTIONS.map(({ k, title, Icon }) => (
        <div key={k} className="week-section">
          <h3>
            <Icon size={17} /> {title}
          </h3>
          {entry?.[k] ? <Rich text={entry[k]} /> : <p className="muted tiny" style={{ margin: 0 }}>Nothing yet.</p>}
        </div>
      ))}
    </article>
  );
}

export function WeeklyView() {
  const { me } = usePulse();
  const [week, setWeek] = useState(weekOf());
  const live = useLive<WeekData | null>(`/api/weekly?week=${week}`, null);
  const tasks = useLive<Task[]>("/api/tasks", []);
  const other: Who = me === "ash" ? "san" : "ash";
  const thisWeek = weekOf();
  const data = live.data?.week === week ? live.data : null;
  const entry = (w: Who) => data?.entries.find((e) => e.person === w);
  const shipped = tasks.data.filter((t) => t.col === "done" && t.completed_at && weekOf(new Date(t.completed_at)) === week);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Weekly check-in</h1>
          <Squiggle className="title-squig" />
          <p className="sub">Wins, blockers and next week, side by side. Takes five minutes on a Friday.</p>
        </div>
        <div className="week-nav">
          <button className="icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}>
            <I.ChevronLeft />
          </button>
          <strong style={{ minWidth: 150, textAlign: "center" }}>
            {week === thisWeek ? "This week" : `Week of ${shortDay(week)}`}
          </strong>
          <button className="icon-btn" aria-label="Next week" disabled={week >= thisWeek} onClick={() => setWeek(addDays(week, 7))}>
            <I.ChevronRight />
          </button>
          {week !== thisWeek && (
            <button className="btn btn-sm" onClick={() => setWeek(thisWeek)}>
              Today
            </button>
          )}
          {data && data.weeks.length > 0 && (
            <>
              <label className="sr-only" htmlFor="week-jump">
                Jump to week
              </label>
              <select id="week-jump" className="field" style={{ width: "auto", minHeight: 40, borderRadius: 999 }} value="" onChange={(e) => e.target.value && setWeek(e.target.value)}>
                <option value="">Past weeks…</option>
                {data.weeks.map((w) => (
                  <option key={w} value={w}>
                    Week of {shortDay(w)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {!data ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="week-grid">
          {/* Key on week so switching weeks resets the editor; only I edit my card, so no server resync mid-typing. */}
          <MyCard key={week} week={week} entry={entry(me)} />
          <TheirCard who={other} entry={entry(other)} />
        </div>
      )}

      <section className="sheet shipped">
        <div className="section-title" style={{ fontSize: 18 }}>
          <I.Check /> Shipped {week === thisWeek ? "this week" : "that week"}, straight from the board
        </div>
        <div className="week-grid">
          {WHO.map((w) => {
            const mine = shipped.filter((t) => t.assignee === w);
            return (
              <div key={w}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <Avatar who={w} /> <strong>{PEOPLE[w].short}</strong> <span className="count">{mine.length}</span>
                </div>
                {mine.length ? (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {mine.map((t) => (
                      <li key={t.id}>{t.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted tiny" style={{ margin: 0 }}>
                    Nothing in Done yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
