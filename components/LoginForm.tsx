"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { PEOPLE, WHO, type Who } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const [who, setWho] = useState<Who | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem("teem:who");
      if (last === "ash" || last === "san") setWho(last);
    } catch {
      /* storage blocked */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!who) return setError("Pick who you are first");
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ who, passcode }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error || "Couldn't sign in");
    try {
      localStorage.setItem("teem:who", who);
    } catch {}
    router.replace("/");
    router.refresh();
  }

  return (
    <form className="sheet login-card stack" onSubmit={submit} style={{ gap: 18 }}>
      <h1 style={{ fontSize: 28 }}>Who&apos;s this?</h1>
      <div className="who-pick" role="group" aria-label="Who are you">
        {WHO.map((w) => (
          <button key={w} type="button" className={w} aria-pressed={who === w} onClick={() => setWho(w)}>
            <Avatar who={w} large />
            I&apos;m {PEOPLE[w].short}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="pc">
          Secret passcode
        </label>
        <input
          id="pc"
          className="field"
          type="password"
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="the one only we know"
        />
      </div>
      {error && (
        <p className="error-text" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      <button className="btn btn-sun" disabled={busy || !passcode}>
        {busy ? "Opening…" : "Let me in"}
      </button>
    </form>
  );
}
