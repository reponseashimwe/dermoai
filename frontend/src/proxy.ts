import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPaths = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server-side can't read localStorage tokens, so we rely on a cookie hint.
  // The auth guard on the client will do the actual redirect.
  // This proxy provides a fast redirect for obvious cases.
  const hasToken = request.cookies.get("dermoai_has_session")?.value === "true";

  // Redirect authenticated users away from auth pages to dashboard
  if (hasToken && authPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/profile/:path*", "/admin/:path*"],
};
