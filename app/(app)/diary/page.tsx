import type { Metadata } from "next";
import { Diary } from "@/components/Diary";

export const metadata: Metadata = { title: "Diary · teem" };

export default function Page() {
  return <Diary />;
}
