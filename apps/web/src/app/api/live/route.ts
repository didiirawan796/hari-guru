import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { getLiveState } from "@/lib/undian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getLiveState();
    return NextResponse.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
