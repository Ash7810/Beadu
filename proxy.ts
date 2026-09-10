import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, SESSION_COOKIE_NAME } from "@/lib/authServer";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionToken(sessionCookie);

    if (!session.valid) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
