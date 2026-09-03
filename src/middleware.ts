import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** Reachable without a session. Everything else redirects to /login. */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/subscribe",
  "/forgot-password",
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

  // The marketing homepage stays reachable even when signed in — like most
  // SaaS sites, a logged-in visitor can still browse it (the nav reflects
  // their session instead of showing Log in/Sign up). It used to force a
  // redirect to /dashboard here, which meant a signed-in admin could never
  // actually reach the modules grid or /subscribe by browsing the site —
  // only /login and /signup skip this file entirely (see PUBLIC_PREFIXES);
  // those validate the session themselves rather than trusting the cookie.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons.svg|.*\\.(?:png|jpg|svg)$).*)"],
};
