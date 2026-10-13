// Inline stroke icons, drawn to match the hand-made sticker strokes.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Plus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const X = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const Check = (p: P) => <Svg {...p}><path d="M4.5 12.5l5 5L19.5 7" /></Svg>;
export const Search = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>;
export const Flame = (p: P) => (
  <Svg {...p}><path d="M12 21c4 0 6.5-2.6 6.5-6.2 0-3.7-3-6-3.6-9.3-1.7 1.3-2.6 3-2.7 4.8-1-1-1.6-2.1-1.7-3.3C8 9 5.5 11.7 5.5 14.8 5.5 18.4 8 21 12 21z" /></Svg>
);
export const Calendar = (p: P) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Svg>
);
export const Bubble = (p: P) => <Svg {...p}><path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2h-7l-5 4v-4H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></Svg>;
export const ListCheck = (p: P) => (
  <Svg {...p}><path d="M4 6.5l1.8 1.8L9 5M4 13.5l1.8 1.8L9 12M12.5 7h7.5M12.5 14h7.5M12.5 19.5h7.5" /></Svg>
);
export const Pin = (p: P) => <Svg {...p}><path d="M9 3.5h6l-1 6 3.5 3.5h-11L10 9.5zM12 13v7.5" /></Svg>;
export const LinkIcon = (p: P) => (
  <Svg {...p}><path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" /></Svg>
);
export const Trash = (p: P) => (
  <Svg {...p}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" /></Svg>
);
export const Edit = (p: P) => <Svg {...p}><path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 013 3L8 18.5zM13.5 7l3 3" /></Svg>;
export const ArrowRight = (p: P) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const ChevronLeft = (p: P) => <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="M9 5l7 7-7 7" /></Svg>;
export const Logout = (p: P) => <Svg {...p}><path d="M14 4h4.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" /></Svg>;
export const Sun = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></Svg>
);
export const Cloud = (p: P) => <Svg {...p}><path d="M7 18.5h10a4 4 0 00.6-8 6 6 0 00-11.4 1.5A3.3 3.3 0 007 18.5z" /></Svg>;
export const Rain = (p: P) => (
  <Svg {...p}><path d="M7 14.5h10a3.7 3.7 0 00.5-7.4 5.6 5.6 0 00-10.7 1.4A3 3 0 007 14.5zM8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" /></Svg>
);
export const Sparkle = (p: P) => <Svg {...p}><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></Svg>;
export const Board = (p: P) => <Svg {...p}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M9.2 4v16M14.8 4v16" /></Svg>;
export const Book = (p: P) => <Svg {...p}><path d="M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20" /></Svg>;
export const Inbox = (p: P) => <Svg {...p}><path d="M4 13.5L6.5 5h11L20 13.5V19H4zM4 13.5h4.5l1 2h5l1-2H20" /></Svg>;
export const Scale = (p: P) => <Svg {...p}><path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6h5zM19 7l-2.5 6h5" /></Svg>;
export const Week = (p: P) => <Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14.5h2M12 14.5h4" /></Svg>;
export const Pulse = (p: P) => <Svg {...p}><path d="M3 12h4l2.5-6 4.5 12 2.5-6H21" /></Svg>;
export const Grip = (p: P) => (
  <Svg {...p}><circle cx="9" cy="6" r=".8" /><circle cx="15" cy="6" r=".8" /><circle cx="9" cy="12" r=".8" /><circle cx="15" cy="12" r=".8" /><circle cx="9" cy="18" r=".8" /><circle cx="15" cy="18" r=".8" /></Svg>
);
