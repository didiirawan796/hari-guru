import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import { createSesi } from "@/lib/admin";

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
      namaHadiah?: unknown;
      urutan?: unknown;
      jumlahPemenang?: unknown;
    };
    const sesiId = await createSesi(payload);

    return NextResponse.json({ ok: true, id: sesiId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
