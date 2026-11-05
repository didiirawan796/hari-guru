import type { DrawingState, LiveState } from "./undian-types";

/**
 * Mengirim event ke WS server agar semua layar panggung dan halaman live
 * ikut diperbarui.
 *
 * Kegagalan realtime tidak boleh membatalkan hasil undian yang sudah
 * tersimpan di database.
 */
async function emitInternal(event: string, payload: unknown): Promise<boolean> {
  const baseUrl = process.env.WS_URL;
  const secret = process.env.WS_INTERNAL_SECRET;

  if (!baseUrl || !secret) {
    console.warn(
      "WS_URL atau WS_INTERNAL_SECRET belum diatur; event realtime dilewati.",
    );
    return false;
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/internal/emit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": secret,
        },
        body: JSON.stringify({ event, payload }),
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      },
    );

    if (!response.ok) {
      console.warn(
        `WS server menolak event ${event} (${response.status}).`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`Gagal mengirim event ${event}:`, error);
    return false;
  }
}

export async function broadcastDrawing(state: DrawingState): Promise<void> {
  await emitInternal("undian:drawing", state);
}

export async function broadcastUndian(state: LiveState): Promise<void> {
  await emitInternal("undian:update", state);
}
