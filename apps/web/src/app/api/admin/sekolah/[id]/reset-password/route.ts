import { NextResponse } from "next/server";
import { resetPasswordSekolah } from "@/lib/admin";
import { ApiError, apiErrorResponse, requireApiSession } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiSession(["admin"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Format permintaan tidak valid.");
    }

    const { id } = await params;
    const payload =
      body && typeof body === "object"
        ? (body as { password?: unknown })
        : {};
    await resetPasswordSekolah(id, payload.password);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
