import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSessionToken, type SessionRole } from "@/lib/jwt";
import {
  clientIp,
  consumeRateLimit,
  rateLimitResponse,
  resetRateLimit,
} from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

interface AdminRow {
  id: string;
  username: string;
  password_hash: string;
  role: SessionRole;
}

export async function POST(request: Request) {
  const limitKey = `login-admin:${clientIp(request)}`;
  const limit = consumeRateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return rateLimitResponse(limit, "Terlalu banyak percobaan login panitia.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const candidate =
    body && typeof body === "object"
      ? (body as { username?: unknown; password?: unknown })
      : {};
  const username =
    typeof candidate.username === "string"
      ? candidate.username.trim().toLowerCase()
      : "";
  const password =
    typeof candidate.password === "string" ? candidate.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const result = await query<AdminRow>(
      `SELECT id, username, password_hash, role
       FROM admin_kecamatan
       WHERE username = $1
       LIMIT 1`,
      [username],
    );
    const admin = result.rows[0];
    const valid = admin
      ? await bcrypt.compare(password, admin.password_hash)
      : false;

    if (!admin || !valid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 },
      );
    }

    if (admin.role !== "admin" && admin.role !== "operator") {
      return NextResponse.json(
        { error: "Role akun tidak valid." },
        { status: 403 },
      );
    }

    resetRateLimit(limitKey);

    const token = await createSessionToken({
      sub: admin.id,
      role: admin.role,
      username: admin.username,
      namaTampilan:
        admin.role === "operator" ? "Operator Panitia" : "Admin Kecamatan",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      redirect: admin.role === "operator" ? "/operator" : "/admin",
    });
  } catch (error) {
    console.error("Login admin gagal:", error);
    return NextResponse.json(
      { error: "Server sedang bermasalah. Coba lagi." },
      { status: 500 },
    );
  }
}
