import { NextResponse } from "next/server";
import { apiErrorResponse, requireApiSession } from "@/lib/api";
import { deleteSesi } from "@/lib/admin";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiSession(["admin"]);
    const { id } = await params;
    await deleteSesi(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
