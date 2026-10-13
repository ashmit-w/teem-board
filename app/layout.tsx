import type { Metadata, Viewport } from "next";
import { Shantell_Sans } from "next/font/google";
import "./globals.css";

const shantell = Shantell_Sans({
  subsets: ["latin"],
  variable: "--font-shantell",
  axes: ["BNCE", "INFM"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "teem",
  description: "San + Ash's shared board, diary and brain dump.",
};

export const viewport: Viewport = {
  themeColor: "#F7F3FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={shantell.variable}>
      <body>
        {/* Hand-drawn wobble from the H · Journal sticker direction. Used on decorative SVG only. */}
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id="wob">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5" />
              <feDisplacementMap in="SourceGraphic" scale="4" />
            </filter>
            <filter id="wob-sm">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" />
              <feDisplacementMap in="SourceGraphic" scale="2.5" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
