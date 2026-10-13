import { cookies } from "next/headers";
import { COOKIE, SESSION_DAYS, isWho, makeToken, passcodeOk } from "@/lib/auth";

export async function POST(req: Request) {
  const { who, passcode } = (await req.json().catch(() => ({}))) as { who?: string; passcode?: string };
  if (!isWho(who)) return Response.json({ error: "Pick San or Ash" }, { status: 400 });
  if (process.env.VERCEL && !process.env.TEEM_PASSCODE) {
    return Response.json({ error: "TEEM_PASSCODE is not set in Vercel env vars" }, { status: 500 });
  }
  if (typeof passcode !== "string" || !(await passcodeOk(passcode))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: "That's not the passcode" }, { status: 401 });
  }
  (await cookies()).set(COOKIE, await makeToken(who), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return Response.json({ who });
}
