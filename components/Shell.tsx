"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "./Avatar";
import * as I from "./icons";
import { Logo, Squiggle } from "./Logo";
import { PulseProvider, api, usePulse } from "./live";
import { PEOPLE, type Who } from "@/lib/types";
import { timeAgo } from "@/lib/util";

const NAV = [
  { href: "/", label: "Board", icon: I.Board },
  { href: "/diary", label: "Diary", icon: I.Book },
  { href: "/dump", label: "Info dump", icon: I.Inbox },
  { href: "/decisions", label: "Decisions", icon: I.Scale },
  { href: "/weekly", label: "Weekly", icon: I.Week },
  { href: "/activity", label: "Activity", icon: I.Pulse },
];

const PAGE_NAMES: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.href, n.label]));

function Presence() {
  const { me, pulse } = usePulse();
  const other: Who = me === "ash" ? "san" : "ash";
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const p = pulse?.presence.find((x) => x.who === other);
  const live = p && Date.now() - new Date(p.seen_at).getTime() < 20_000;
  return (
    <div className="presence" title={p ? `${PEOPLE[other].name} last seen ${new Date(p.seen_at).toLocaleString()}` : undefined}>
      <span className={`dot${live ? " live" : ""}`} aria-hidden="true" />
      <span>
        <strong>{PEOPLE[other].short}</strong>{" "}
        {live ? (
          <>
            here now<span className="where"> · {PAGE_NAMES[p!.page] ?? "around"}</span>
          </>
        ) : p ? (
          `seen ${timeAgo(p.seen_at)}`
        ) : (
          "hasn't been in yet"
        )}
      </span>
    </div>
  );
}

function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = usePulse();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="teem home">
        <Logo height={40} />
      </Link>
      <nav className="nav" aria-label="Sections">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>
            <Icon size={17} />
            {label}
            <Squiggle className="squig" />
          </Link>
        ))}
      </nav>
      <Presence />
      <div className="row">
        <Avatar who={me} />
        <button
          className="icon-btn"
          aria-label="Sign out"
          title="Sign out"
          onClick={async () => {
            await api("POST", "/api/auth/logout");
            router.replace("/login");
            router.refresh();
          }}
        >
          <I.Logout />
        </button>
      </div>
    </header>
  );
}

export function Shell({ me, children }: { me: Who; children: ReactNode }) {
  return (
    <PulseProvider me={me}>
      <div className="shell">
        <Topbar />
        {children}
      </div>
    </PulseProvider>
  );
}
