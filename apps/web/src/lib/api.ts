import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { Session, SessionRole } from "./jwt";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApiSession(
  allowed: SessionRole[],
): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new ApiError(401, "Sesi tidak ditemukan. Silakan login kembali.");
  }
  if (!allowed.includes(session.role)) {
    throw new ApiError(403, "Anda tidak memiliki akses ke aksi ini.");
  }
  return session;
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("API error:", error);
  return NextResponse.json(
    { error: "Terjadi kesalahan pada server. Coba lagi." },
    { status: 500 },
  );
}
