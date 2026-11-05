import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import { buildCsv } from "@/lib/import-export";
import { getPemenangForExport } from "@/lib/undian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiSession(["admin", "operator"]);

    const { searchParams } = new URL(request.url);
    const sesiId = searchParams.get("sesi");
    if (!sesiId) {
      throw new ApiError(400, "Parameter sesi wajib diisi.");
    }

    const { sesi, pemenang } = await getPemenangForExport(sesiId);

    const csv = buildCsv(
      [
        "SESI",
        "URUTAN",
        "HADIAH_KE",
        "NOMOR_UNDIAN",
        "NAMA",
        "SEKOLAH",
        "PERAN",
        "WAKTU_MENANG",
      ],
      pemenang.map((item) => [
        sesi.namaHadiah,
        sesi.urutan,
        item.hadiahKe,
        item.nomorUndian,
        item.nama,
        item.sekolah,
        item.peran,
        item.waktuMenang,
      ]),
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pemenang-sesi-${sesi.urutan}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
