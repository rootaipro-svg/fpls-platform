import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const protectedPath = req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/facilities") ||
    req.nextUrl.pathname.startsWith("/visits");

  const session = req.cookies.get("fpls_session")?.value;
  if (protectedPath && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/facilities/:path*", "/visits/:path*"]
};
