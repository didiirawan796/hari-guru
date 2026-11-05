import { NextResponse } from "next/server";
import { apiErrorResponse, requireApiSession } from "@/lib/api";
import { buildTemplateExcel } from "@/lib/import-export";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireApiSession(["sekolah"]);
    const buffer = await buildTemplateExcel();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-peserta-hari-guru-2026.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
