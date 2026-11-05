import { NextResponse } from "next/server";
import { apiErrorResponse, requireApiSession } from "@/lib/api";
import { broadcastUndian } from "@/lib/realtime";
import { getOperatorData, mulaiSesi } from "@/lib/undian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiSession(["operator"]);
    const { id } = await params;

    await mulaiSesi(id);
    const data = await getOperatorData();
    await broadcastUndian(data.live);

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
