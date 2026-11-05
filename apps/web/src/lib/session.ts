import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  verifySessionToken,
  type Session,
  type SessionRole,
} from "./jwt";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function homeForRole(role: SessionRole): string {
  if (role === "sekolah") return "/dashboard-sekolah";
  if (role === "operator") return "/operator";
  return "/admin";
}

export function loginForRole(role: SessionRole): string {
  return role === "sekolah" ? "/login-sekolah" : "/login-admin";
}

export async function requireRole(
  allowed: SessionRole[],
): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(allowed.includes("sekolah") ? "/login-sekolah" : "/login-admin");
  }
  if (!allowed.includes(session.role)) {
    redirect(homeForRole(session.role));
  }
  return session;
}
