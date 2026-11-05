import { NextResponse } from "next/server";
import { apiErrorResponse, requireApiSession } from "@/lib/api";
import { getPesertaForExport } from "@/lib/admin";
import { buildCsv } from "@/lib/import-export";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireApiSession(["admin"]);
    const { searchParams } = new URL(request.url);
    const sekolahId = searchParams.get("sekolah") ?? undefined;
    const peserta = await getPesertaForExport(sekolahId);

    const csv = buildCsv(
      ["NOMOR_UNDIAN", "NAMA", "SEKOLAH", "PERAN"],
      peserta.map((item) => [
        item.nomorUndian,
        item.nama,
        item.sekolah,
        item.peran,
      ]),
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="peserta-hari-guru-2026.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
