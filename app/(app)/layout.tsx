import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { currentWho } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await currentWho();
  if (!me) redirect("/login");
  return <Shell me={me}>{children}</Shell>;
}
