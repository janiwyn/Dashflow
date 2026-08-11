import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Reachable without a session. Everything else redirects to /login. */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/subscribe",
  "/forgot-password",
  "/new-password",
  "/customer-portal",
  "/track-order",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // "/" is the public marketing homepage — only an exact match, so every
  // authenticated route (which all live one level deeper, e.g. /dashboard,
  // /pos, /sales) is still guarded normally below.
  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // Cookie presence only — an optimistic check, deliberately not a DB read.
  // Pages still call requireUser(), which validates the session for real.
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in visitors don't need the marketing pitch — send them straight
  // into the app. /login and /signup are deliberately NOT redirected here:
  // this check only sees a cookie, not a validated session, and a stale
  // cookie (e.g. after a db:seed wipes the session table) would bounce
  // /login -> /dashboard -> (requireUser fails) -> /login forever. Those
  // pages validate the session themselves and redirect only when it's real.
  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons.svg|.*\\.(?:png|jpg|svg)$).*)"],
};
