import type { Metadata } from "next";
import { Decisions } from "@/components/Decisions";

export const metadata: Metadata = { title: "Decisions · teem" };

export default function Page() {
  return <Decisions />;
}
