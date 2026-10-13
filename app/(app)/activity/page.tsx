import type { Metadata } from "next";
import { ActivityFeed } from "@/components/ActivityFeed";

export const metadata: Metadata = { title: "Activity · teem" };

export default function Page() {
  return <ActivityFeed />;
}
