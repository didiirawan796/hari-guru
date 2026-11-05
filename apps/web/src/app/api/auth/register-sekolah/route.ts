import { NextResponse } from "next/server";
import { createSekolah } from "@/lib/admin";
import { ApiError, apiErrorResponse } from "@/lib/api";
import { query } from "@/lib/db";
import { createSessionToken } from "@/lib/jwt";
import {
  clientIp,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

interface SekolahBaruRow {
  id: string;
  nama_sekolah: string;
  username: string;
}

export async function POST(request: Request) {
  try {
    const limit = consumeRateLimit(
      `register-sekolah:${clientIp(request)}`,
      REGISTER_LIMIT,
      REGISTER_WINDOW_MS,
    );
    if (!limit.allowed) {
      return rateLimitResponse(
        limit,
        "Terlalu banyak pendaftaran dari jaringan ini.",
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Format permintaan tidak valid.");
    }

    const payload =
      body && typeof body === "object"
        ? (body as {
            namaSekolah?: unknown;
            username?: unknown;
            password?: unknown;
          })
        : {};
    const sekolahId = await createSekolah(payload);

    const result = await query<SekolahBaruRow>(
      `SELECT id, nama_sekolah, username
       FROM sekolah
       WHERE id = $1
       LIMIT 1`,
      [sekolahId],
    );
    const sekolah = result.rows[0];
    if (!sekolah) {
      throw new ApiError(500, "Akun sekolah gagal dibaca setelah didaftarkan.");
    }

    const token = await createSessionToken({
      sub: sekolah.id,
      role: "sekolah",
      username: sekolah.username,
      namaTampilan: sekolah.nama_sekolah,
      sekolahId: sekolah.id,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      redirect: "/dashboard-sekolah",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
