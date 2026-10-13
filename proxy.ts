import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, readToken } from "@/lib/auth";

// Optimistic gate only: API routes re-check the session themselves (lib/api.ts).
export async function proxy(req: NextRequest) {
  const who = await readToken(req.cookies.get(COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const onLogin = pathname === "/login";

  if (!who && !onLogin) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (who && onLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
