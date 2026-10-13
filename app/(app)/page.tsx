import type { Metadata } from "next";
import { Board } from "@/components/board/Board";

export const metadata: Metadata = { title: "The board · teem" };

export default function Page() {
  return <Board />;
}
