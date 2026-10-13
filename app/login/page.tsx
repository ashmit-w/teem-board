import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Sign in · teem" };

export default function LoginPage() {
  return (
    <main className="login">
      <div className="stack" style={{ alignItems: "center", gap: 28, width: "100%" }}>
        <Logo height={150} />
        <LoginForm />
      </div>
    </main>
  );
}
