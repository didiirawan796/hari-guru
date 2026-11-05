import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import {
  PesertaError,
  simpanPeserta,
  validasiBarisPeserta,
} from "@/lib/peserta";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(["sekolah"]);
    if (!session.sekolahId) {
      throw new ApiError(403, "Akun ini tidak terhubung dengan sekolah.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Format permintaan tidak valid.");
    }

    const rows = validasiBarisPeserta(
      (body as { peserta?: unknown }).peserta,
      { izinkanId: true },
    );
    const peserta = await simpanPeserta(session.sekolahId, rows);

    return NextResponse.json({ ok: true, peserta });
  } catch (error) {
    if (error instanceof PesertaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
