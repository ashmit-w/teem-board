"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { Squiggle } from "./Logo";
import { useLive } from "./live";
import { PEOPLE, type Activity, type Who } from "@/lib/types";
import { clock, localDayOf, prettyDay } from "@/lib/util";

const WHERE: Record<Activity["target_type"], string> = {
  task: "/",
  diary: "/diary",
  dump: "/dump",
  decision: "/decisions",
  weekly: "/weekly",
};

export function ActivityFeed() {
  const live = useLive<Activity[]>("/api/activity?limit=300", []);
  const [who, setWho] = useState<Who | "all">("all");

  const days = useMemo(() => {
    const m = new Map<string, Activity[]>();
    for (const a of live.data) {
      if (who !== "all" && a.actor !== who) continue;
      const d = localDayOf(a.created_at);
      m.set(d, [...(m.get(d) ?? []), a]);
    }
    return [...m.entries()];
  }, [live.data, who]);

  return (
    <main className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>What happened</h1>
          <Squiggle className="title-squig" />
          <p className="sub">Everything either of us touched, newest first.</p>
        </div>
        <div className="seg" role="group" aria-label="Filter by person">
          {(["all", "ash", "san"] as const).map((p) => (
            <button key={p} aria-pressed={who === p} onClick={() => setWho(p)}>
              {p === "all" ? "Both" : PEOPLE[p].short}
            </button>
          ))}
        </div>
      </div>

      {live.loading && <p className="muted">Loading…</p>}
      {!live.loading && days.length === 0 && <p className="muted">Quiet so far.</p>}
      {days.map(([day, items]) => (
        <section key={day} className="feed" style={{ marginBottom: 26 }}>
          <h2 className="day-sticker" style={{ fontSize: 16 }}>
            {prettyDay(day)}
          </h2>
          <div className="sheet" style={{ padding: "4px 18px" }}>
            <ul>
              {items.map((a) => (
                <li key={a.id}>
                  <Avatar who={a.actor} />
                  <div className="grow">
                    <strong>{PEOPLE[a.actor].short}</strong> {a.summary}
                    <div className="tiny muted">
                      {clock(a.created_at)} · <Link href={WHERE[a.target_type]}>{a.target_type}</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </main>
  );
}
