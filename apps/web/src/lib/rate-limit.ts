import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

// Disimpan di memori proses. Setiap instance web punya hitungan sendiri.
// Untuk produksi multi-instance, tetap aktifkan rate limit di reverse proxy.
const buckets = new Map<string, RateLimitEntry>();
const MAX_BUCKETS = 10_000;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "lokal";
}

/**
 * Menambah satu percobaan pada jendela waktu tetap.
 * Panggil sekali untuk setiap request yang ingin dibatasi.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function rateLimitResponse(
  result: RateLimitResult,
  message: string,
): NextResponse {
  const retryAfter = Math.max(1, result.retryAfter);
  return NextResponse.json(
    {
      error: `${message} Coba lagi dalam ${retryAfter} detik.`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
