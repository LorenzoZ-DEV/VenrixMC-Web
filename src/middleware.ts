import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "venrix_session";

/**
 * Edge-safe gate: only checks whether a session cookie is present (the
 * Edge runtime can't reach Redis/Prisma directly). Real authentication and
 * per-role authorization is enforced server-side in `src/lib/auth.ts`
 * (used by the dashboard layout and every API route handler) — this
 * middleware just avoids serving the dashboard shell to anonymous users.
 *
 * Deliberately does NOT redirect /login → /dashboard just because a cookie
 * exists: a cookie can outlive its Redis-backed session (expired, revoked,
 * or wiped by a dev-mode REDIS_MOCK restart). Trusting cookie-presence both
 * ways creates a redirect loop (dashboard bounces to /login on invalid
 * session, middleware bounces straight back because the stale cookie is
 * still there). The login page itself checks the real session server-side
 * and redirects away if it's actually valid — see src/app/login/page.tsx.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/debug")) && !hasCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/debug/:path*"],
};
