import type { Metadata } from "next";
import { WeeklyView } from "@/components/WeeklyView";

export const metadata: Metadata = { title: "Weekly · teem" };

export default function Page() {
  return <WeeklyView />;
}
