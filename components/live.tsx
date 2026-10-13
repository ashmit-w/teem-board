"use client";

// Live sync: one tiny /api/pulse poll per tab. Pages refetch only when the board revision moves.
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Avatar } from "./Avatar";
import { PEOPLE, type Pulse, type Who } from "@/lib/types";

const POLL_MS = 5000;

export async function api<T>(method: string, url: string, data?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data === undefined ? undefined : { "content-type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Signed out");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json as T;
}

type Toast = { id: number; text: string; who?: Who; error?: boolean };

const Ctx = createContext<{
  me: Who;
  pulse: Pulse | null;
  notify: (text: string, opts?: { who?: Who; error?: boolean }) => void;
  refresh: () => void;
} | null>(null);

export function usePulse() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePulse outside PulseProvider");
  return c;
}

export function PulseProvider({ me, children }: { me: Who; children: ReactNode }) {
  const pathname = usePathname();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastActivity = useRef<string | null | undefined>(undefined);
  const nextId = useRef(1);

  const notify = useCallback((text: string, opts: { who?: Who; error?: boolean } = {}) => {
    const t = { id: nextId.current++, text, ...opts };
    setToasts((ts) => [...ts.slice(-3), t]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), opts.error ? 7000 : 5000);
  }, []);

  const tick = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const p = await api<Pulse>("GET", `/api/pulse?page=${encodeURIComponent(pathname)}`);
      setPulse((prev) => (prev && prev.rev === p.rev && JSON.stringify(prev.presence) === JSON.stringify(p.presence) ? prev : p));
      // Toast what the other founder just did (skip the very first poll).
      const latest = p.latest;
      if (lastActivity.current !== undefined && latest && latest.id !== lastActivity.current && latest.actor !== me) {
        notify(`${PEOPLE[latest.actor].short} ${latest.summary}`, { who: latest.actor });
      }
      lastActivity.current = latest?.id ?? null;
    } catch {
      /* offline or redeploying: try again next tick */
    }
  }, [pathname, me, notify]);

  useEffect(() => {
    tick();
    const t = setInterval(tick, POLL_MS);
    const wake = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [tick]);

  return (
    <Ctx.Provider value={{ me, pulse, notify, refresh: tick }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.error ? " error" : ""}`}>
            {t.who && <Avatar who={t.who} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Fetches `url` now and again whenever the shared revision changes. */
export function useLive<T>(url: string | null, initial: T) {
  const { pulse, notify } = usePulse();
  const rev = pulse?.rev;
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!url) return;
    const mine = ++seq.current;
    try {
      const d = await api<T>("GET", url);
      if (mine === seq.current) setData(d);
    } catch (e) {
      if (mine === seq.current) notify(e instanceof Error ? e.message : "Couldn't load", { error: true });
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [url, notify]);

  useEffect(() => {
    reload();
  }, [reload, rev]);

  return { data, setData: setData as Dispatch<SetStateAction<T>>, loading, reload };
}

/** Run a mutation; on failure show the error and resync. */
export function useMutate() {
  const { notify, refresh } = usePulse();
  return useCallback(
    async <T,>(fn: () => Promise<T>, onError?: () => void): Promise<T | undefined> => {
      try {
        const r = await fn();
        refresh();
        return r;
      } catch (e) {
        notify(e instanceof Error ? e.message : "Something went wrong", { error: true });
        onError?.();
        return undefined;
      }
    },
    [notify, refresh],
  );
}
