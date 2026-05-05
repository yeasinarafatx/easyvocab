import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/dashboard",
  "/forgot-password",
  "/login",
  "/payment",
  "/reset-password",
  "/signup",
  "/verify-email",
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noimageindex");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};