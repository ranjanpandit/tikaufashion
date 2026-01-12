import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;

  // Allow Next.js internal RSC requests
  if (searchParams.has("_rsc")) {
    return NextResponse.next();
  }

  // Ignore API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow admin login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;

    // ✅ ONLY check presence, NOT verification
    if (!token) {
      return NextResponse.redirect(
        new URL("/admin/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
