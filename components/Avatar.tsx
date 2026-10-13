import { PEOPLE, type Who } from "@/lib/types";

export function Avatar({ who, large = false }: { who: Who; large?: boolean }) {
  const p = PEOPLE[who];
  return (
    <span className={`avatar${large ? " avatar-lg" : ""}`} style={{ background: p.tone }} title={p.name} aria-label={p.name}>
      {p.short[0]}
    </span>
  );
}
