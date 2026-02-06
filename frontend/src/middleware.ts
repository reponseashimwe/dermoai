import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/profile", "/scan-history", "/consultations", "/patients"];
const adminPaths = ["/admin"];
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server-side can't read localStorage tokens, so we rely on a cookie hint.
  // The auth guard on the client will do the actual redirect.
  // This middleware provides a fast redirect for obvious cases.
  const hasToken = request.cookies.get("dermoai_has_session")?.value === "true";

  // Redirect authenticated users away from auth pages
  if (hasToken && authPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/profile/:path*", "/admin/:path*"],
};
