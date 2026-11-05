import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import {
  MAX_IMPORT_BYTES,
  ImportError,
  parsePesertaFile,
} from "@/lib/import-export";
import {
  PesertaError,
  tambahPeserta,
  validasiBarisPeserta,
} from "@/lib/peserta";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(["sekolah"]);
    if (!session.sekolahId) {
      throw new ApiError(403, "Akun ini tidak terhubung dengan sekolah.");
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(400, "File import wajib dipilih.");
    }
    if (file.size === 0) {
      throw new ApiError(400, "File import kosong.");
    }
    if (file.size > MAX_IMPORT_BYTES) {
      throw new ApiError(400, "Ukuran file maksimal 2 MB.");
    }

    const parsed = await parsePesertaFile(file);
    const rows = validasiBarisPeserta(
      parsed.map((row) => ({ nama: row.nama, peran: row.peran })),
    );
    const peserta = await tambahPeserta(session.sekolahId, rows);

    return NextResponse.json({
      ok: true,
      diimport: parsed.length,
      peserta,
    });
  } catch (error) {
    if (error instanceof ImportError || error instanceof PesertaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === "LIMIT_FILE_SIZE"
    ) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 2 MB." },
        { status: 400 },
      );
    }
    return apiErrorResponse(error);
  }
}
