import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";
import { broadcastDrawing, broadcastUndian } from "@/lib/realtime";
import {
  getKandidatUndian,
  getOperatorData,
  sisipkanPemenangKeKandidat,
  undiPemenang,
} from "@/lib/undian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DRAWING_DURATION_MS = 4200;

function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function POST(request: Request) {
  try {
    await requireApiSession(["operator"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Format permintaan tidak valid.");
    }

    const sesiId = (body as { sesiId?: unknown }).sesiId;
    if (typeof sesiId !== "string") {
      throw new ApiError(400, "Sesi hadiah wajib dipilih.");
    }

    const pemenang = await undiPemenang(sesiId);
    const data = await getOperatorData();

    if (data.live.sesi) {
      const kandidat = await getKandidatUndian(24);
      await broadcastDrawing({
        sesi: data.live.sesi,
        kandidat: sisipkanPemenangKeKandidat(kandidat, pemenang),
        durasiMs: DRAWING_DURATION_MS,
      });

      // Beri waktu layar panggung menampilkan animasi pengacakan
      // sebelum pemenang resmi ditampilkan.
      await tunggu(DRAWING_DURATION_MS);
    }

    await broadcastUndian(data.live);

    return NextResponse.json({ ok: true, pemenang, ...data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
