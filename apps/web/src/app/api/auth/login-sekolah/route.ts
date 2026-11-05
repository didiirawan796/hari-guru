import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSessionToken } from "@/lib/jwt";
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

interface SchoolRow {
  id: string;
  nama_sekolah: string;
  username: string;
  password_hash: string;
}

export async function POST(request: Request) {
  const limitKey = `login-sekolah:${clientIp(request)}`;
  const limit = consumeRateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return rateLimitResponse(
      limit,
      "Terlalu banyak percobaan login sekolah.",
    );
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
    const result = await query<SchoolRow>(
      `SELECT id, nama_sekolah, username, password_hash
       FROM sekolah
       WHERE username = $1
       LIMIT 1`,
      [username],
    );
    const school = result.rows[0];
    const valid = school
      ? await bcrypt.compare(password, school.password_hash)
      : false;

    if (!school || !valid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 },
      );
    }

    resetRateLimit(limitKey);

    const token = await createSessionToken({
      sub: school.id,
      role: "sekolah",
      username: school.username,
      namaTampilan: school.nama_sekolah,
      sekolahId: school.id,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      redirect: "/dashboard-sekolah",
    });
  } catch (error) {
    console.error("Login sekolah gagal:", error);
    return NextResponse.json(
      { error: "Server sedang bermasalah. Coba lagi." },
      { status: 500 },
    );
  }
}
