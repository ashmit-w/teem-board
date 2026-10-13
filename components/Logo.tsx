// The "H · Journal sticker" wordmark: yellow sticker, ink border, pink squiggle, sun + sparkles.

export function Logo({ height = 44, title = "teem" }: { height?: number; title?: string }) {
  return (
    <svg
      height={height}
      width={(height * 520) / 300}
      viewBox="0 0 520 300"
      role="img"
      aria-label={title}
      style={{ transform: "rotate(-4deg)", filter: "drop-shadow(0 6px 8px rgba(30,27,46,.18))", overflow: "visible" }}
    >
      <g filter="url(#wob)" strokeLinecap="round" strokeLinejoin="round">
        <rect x="20" y="20" width="480" height="260" rx="64" fill="#FFFFFF" stroke="#1E1B2E" strokeWidth="6" />
        <rect x="36" y="36" width="448" height="228" rx="50" fill="#FFD84D" />
        <text
          x="262"
          y="186"
          textAnchor="middle"
          fontWeight="800"
          fontSize="150"
          fill="#1E1B2E"
          style={{ fontFamily: "var(--font-shantell), 'Shantell Sans', cursive" }}
        >
          teem
        </text>
        <path d="M126 222 q20 -14 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#FF5E8A" strokeWidth="9" />
        <circle cx="88" cy="86" r="16" fill="#FF9F43" stroke="#1E1B2E" strokeWidth="4" />
        <path d="M88 56 v-10 M88 116 v10 M58 86 h-10 M118 86 h10 M67 65 l-7 -7 M109 107 l7 7 M67 107 l-7 7 M109 65 l7 -7" stroke="#1E1B2E" strokeWidth="4" />
        <path d="M438 50 Q441 66 457 69 Q441 72 438 88 Q435 72 419 69 Q435 66 438 50Z" fill="#FFFFFF" stroke="#1E1B2E" strokeWidth="4" />
        <path d="M452 238 C442 230 436 224 442 217 C446 213 452 216 452 221 C452 216 458 213 462 217 C468 224 462 230 452 238Z" fill="#FF5E8A" stroke="#1E1B2E" strokeWidth="3.5" />
      </g>
    </svg>
  );
}

/** Wavy underline used under page titles and the active nav tab. */
export function Squiggle({ className, color = "#FF5E8A" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 12" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 7 q8.5 -7 17 0 t17 0 t17 0 t17 0 t17 0 t17 0 t17 0 t17 0" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" filter="url(#wob-sm)" />
    </svg>
  );
}
