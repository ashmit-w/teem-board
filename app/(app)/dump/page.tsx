import type { Metadata } from "next";
import { Dump } from "@/components/Dump";

export const metadata: Metadata = { title: "Info dump · teem" };

export default function Page() {
  return <Dump />;
}
