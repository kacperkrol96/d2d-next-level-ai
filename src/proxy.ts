import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "nle_demo_session";

/** Szybkie przekierowanie niezalogowanych na /login (pełna kontrola ról w stronach). */
export function proxy(request: NextRequest) {
  const loggedIn = request.cookies.has(SESSION_COOKIE);
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  if (!loggedIn && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sounds).*)"],
};
