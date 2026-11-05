import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionRole,
} from "@/lib/jwt";

const protectedRoutes: Array<{
  prefix: string;
  allowed: SessionRole[];
  login: string;
}> = [
  {
    prefix: "/dashboard-sekolah",
    allowed: ["sekolah"],
    login: "/login-sekolah",
  },
  { prefix: "/admin", allowed: ["admin"], login: "/login-admin" },
  { prefix: "/operator", allowed: ["operator"], login: "/login-admin" },
];

function homeFor(role: SessionRole): string {
  if (role === "sekolah") return "/dashboard-sekolah";
  if (role === "operator") return "/operator";
  return "/admin";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (
    pathname === "/login-sekolah" ||
    pathname === "/login-admin" ||
    pathname === "/daftar-sekolah"
  ) {
    if (session) {
      return NextResponse.redirect(new URL(homeFor(session.role), request.url));
    }
    return NextResponse.next();
  }

  const rule = protectedRoutes.find((route) =>
    pathname.startsWith(route.prefix),
  );
  if (!rule) return NextResponse.next();

  if (!session) {
    const url = new URL(rule.login, request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.allowed.includes(session.role)) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard-sekolah/:path*",
    "/admin/:path*",
    "/operator/:path*",
    "/login-sekolah",
    "/login-admin",
    "/daftar-sekolah",
  ],
};
