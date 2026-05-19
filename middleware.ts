import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_PATHS = [
  "/admin",
  "/api",
  "/badges",
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

  // --- Added: protected-route redirect for unauthenticated users ---
  // Do not modify existing logic above — only add checks here.
  const PROTECTED_PREFIXES = [
    "/learn",
    "/stage",
    "/flashcard",
    "/speak",
    "/core",
    "/resources",
  ];

  const matchesProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (matchesProtected) {
    const isAuthenticated = !!request.cookies.get("sb-zdbjsqfdymhlfwywpucs-auth-token")?.value;

    // If not authenticated, redirect to landing page `/`
    if (!isAuthenticated) {
      const redirectUrl = new URL("/", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  // --- end added logic ---

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};