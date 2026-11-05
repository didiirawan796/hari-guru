import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import { createSekolah } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireApiSession(["admin"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Format permintaan tidak valid.");
    }

    const payload = body as {
      namaSekolah?: unknown;
      username?: unknown;
      password?: unknown;
    };
    const sekolahId = await createSekolah(payload);

    return NextResponse.json({ ok: true, id: sekolahId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
