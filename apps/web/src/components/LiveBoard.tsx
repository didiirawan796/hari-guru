"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { BrandMark } from "./BrandMark";
import { PublicNavLinks } from "./PublicNavLinks";
import type {
  DrawingState,
  LiveState,
  PemenangRecord,
  SesiRingkas,
} from "@/lib/undian-types";

interface LiveBoardProps {
  initial: LiveState;
  variant: "layar" | "live";
}

function wsUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
}

function statusLabel(sesi: SesiRingkas): string {
  if (sesi.status === "selesai") return "Sesi selesai";
  if (sesi.status === "berjalan") return "Sedang berlangsung";
  return "Menunggu dimulai";
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        connected
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {connected ? "Live" : "Menghubungkan"}
    </span>
  );
}

function WinnerCard({
  pemenang,
  compact = false,
}: {
  pemenang: PemenangRecord;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.06] ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <BrandMark size="xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">
            {pemenang.nama}
          </p>
          <p className="truncate text-[11px] text-white/50">
            {pemenang.sekolah}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-white/40">
          #{pemenang.hadiahKe}
        </span>
      </div>
    </div>
  );
}

export function LiveBoard({ initial, variant }: LiveBoardProps) {
  const [state, setState] = useState<LiveState>(initial);
  const [connected, setConnected] = useState(false);
  const [drawing, setDrawing] = useState<DrawingState | null>(null);
  const [rollIndex, setRollIndex] = useState(0);

  useEffect(() => {
    const socket = io(wsUrl(), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("public:join");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("undian:drawing", (payload: DrawingState) => {
      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray(payload.kandidat) &&
        payload.kandidat.length > 0
      ) {
        setRollIndex(0);
        setDrawing(payload);
      }
    });
    socket.on("undian:update", (payload: LiveState) => {
      if (payload && typeof payload === "object" && "pemenang" in payload) {
        setDrawing(null);
        setState(payload);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!drawing || drawing.kandidat.length === 0) return;

    const timer = window.setInterval(() => {
      setRollIndex((current) => (current + 1) % drawing.kandidat.length);
    }, 90);
    return () => window.clearInterval(timer);
  }, [drawing]);

  useEffect(() => {
    if (!drawing) return;

    // Jaring pengaman bila event hasil tidak sampai ke layar.
    const timer = window.setTimeout(
      () => {
        setDrawing(null);
        void fetch("/api/live", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : null))
          .then((payload: LiveState | null) => {
            if (payload?.sesi) setState(payload);
          })
          .catch(() => undefined);
      },
      drawing.durasiMs + 4000,
    );
    return () => window.clearTimeout(timer);
  }, [drawing]);

  useEffect(() => {
    if (connected) return;

    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as LiveState;
        if (!cancelled) setState(payload);
      } catch {
        // Diamkan; socket akan mencoba menyambung ulang.
      }
    }

    void poll();
    const timer = window.setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [connected]);

  const sesi = state.sesi;
  const pemenangTerakhir = useMemo(
    () => state.pemenang[state.pemenang.length - 1] ?? null,
    [state.pemenang],
  );
  const selesai = sesi ? sesi.totalPemenang >= sesi.jumlahPemenang : false;
  const kandidatAktif = drawing
    ? drawing.kandidat[rollIndex % drawing.kandidat.length]
    : null;

  if (variant === "layar") {
    return (
      <main className="flex min-h-dvh flex-col bg-panggung text-white">
        <header className="border-b border-white/10 px-6 py-4 sm:px-10 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <div>
                <p className="text-sm font-extrabold tracking-wide">
                  HARI GURU 2026
                </p>
                <p className="text-[11px] text-white/55">
                  Undian doorprize PC Kecamatan Tanjung
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <PublicNavLinks theme="dark" />
              <ConnectionBadge connected={connected} />
              <span className="rounded-full border border-emas/40 bg-emas/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emas-terang">
                Panggung
              </span>
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10">
          {sesi ? (
            <>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emas-terang">
                  Sesi {sesi.urutan} &middot; {sesi.namaHadiah}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  {drawing ? "Mengacak pemenang..." : statusLabel(sesi)}{" "}
                  &middot; {sesi.totalPemenang} dari {sesi.jumlahPemenang}{" "}
                  pemenang
                </p>
              </div>

              <div
                key={`${sesi.id}-${state.pemenang.length}-${
                  drawing ? "drawing" : "idle"
                }`}
                aria-live="polite"
                className={`mx-auto mt-8 w-full max-w-5xl rounded-[2rem] border px-6 py-10 text-center animate-fade-up sm:px-12 sm:py-14 ${
                  drawing
                    ? "border-emas/60 bg-emas/[0.08]"
                    : pemenangTerakhir
                      ? "border-emas/40 bg-white/[0.06]"
                      : "border-dashed border-white/15 bg-white/[0.03]"
                }`}
              >
                {drawing && kandidatAktif ? (
                  <>
                    <div className="flex justify-center">
                      <BrandMark size="md" />
                    </div>
                    <p className="mt-4 animate-pulse text-[11px] font-bold uppercase tracking-[0.3em] text-emas-terang">
                      Mengacak peserta
                    </p>
                    <h1 className="mt-4 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">
                      {kandidatAktif.nama}
                    </h1>
                    <p className="mt-3 text-lg font-semibold text-white/70 sm:text-2xl">
                      {kandidatAktif.sekolah}
                    </p>
                    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                      Pemenang resmi segera ditampilkan
                    </p>
                  </>
                ) : pemenangTerakhir ? (
                  <>
                    <div className="flex justify-center">
                      <BrandMark size="md" />
                    </div>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
                      {selesai ? "Pemenang terakhir" : "Pemenang"}
                    </p>
                    <h1 className="mt-4 break-words text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
                      {pemenangTerakhir.nama}
                    </h1>
                    <p className="mt-4 break-words text-xl font-semibold text-white/75 sm:text-2xl">
                      {pemenangTerakhir.sekolah}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
                      Undian belum dimulai
                    </p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white/85 sm:text-6xl">
                      Menunggu pemenang
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50">
                      Operator akan membuka sesi dan menjalankan undian. Nomor
                      pemenang akan tampil di layar ini secara langsung.
                    </p>
                  </>
                )}
              </div>

              <div className="mx-auto mt-7 w-full max-w-5xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Daftar pemenang sesi ini
                  </p>
                  <p className="font-mono text-[11px] text-white/40">
                    {sesi.totalPemenang}/{sesi.jumlahPemenang}
                  </p>
                </div>
                {state.pemenang.length > 0 ? (
                  <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                    {[...state.pemenang].reverse().map((item) => (
                      <WinnerCard key={item.id} pemenang={item} compact />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-white/40">
                    Belum ada pemenang pada sesi ini.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
                Layar panggung
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
                Belum ada sesi hadiah
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Panitia perlu membuat sesi hadiah di dashboard admin sebelum
                undian dapat dijalankan.
              </p>
            </div>
          )}
        </section>

        <footer className="border-t border-white/10 px-6 py-4 text-center text-[11px] text-white/40 sm:px-10">
          <p>Rabu, 25 November 2026 &middot; PC Kecamatan Tanjung</p>
        </footer>
      </main>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-merah">
            Live undian
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
            {sesi ? sesi.namaHadiah : "Menunggu sesi"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {sesi
              ? `Sesi ${sesi.urutan} · ${
                  drawing ? "Mengacak pemenang..." : statusLabel(sesi)
                }`
              : "Belum ada sesi hadiah yang dibuat panitia."}
          </p>
        </div>
        <ConnectionBadge connected={connected} />
      </div>

      {sesi ? (
        <>
          <div className="overflow-hidden rounded-2xl bg-panggung text-white shadow-kartu">
            <div className="relative px-5 py-8 text-center sm:px-8 sm:py-10">
              <div className="absolute inset-0 bg-pattern-lembut opacity-25" />
              {drawing && kandidatAktif ? (
                <div className="relative">
                  <div className="flex justify-center">
                    <BrandMark size="sm" />
                  </div>
                  <p className="mt-3 animate-pulse text-[10px] font-bold uppercase tracking-[0.24em] text-emas-terang">
                    Mengacak peserta
                  </p>
                  <p className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">
                    {kandidatAktif.nama}
                  </p>
                  <p className="mt-1.5 break-words text-base font-semibold text-white/70">
                    {kandidatAktif.sekolah}
                  </p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Pemenang resmi segera ditampilkan
                  </p>
                </div>
              ) : pemenangTerakhir ? (
                <div
                  key={`${sesi.id}-${state.pemenang.length}`}
                  className="relative animate-fade-up"
                >
                  <div className="flex justify-center">
                    <BrandMark size="sm" />
                  </div>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
                    Pemenang terakhir
                  </p>
                  <p className="mt-2 break-words text-2xl font-extrabold leading-tight sm:text-3xl">
                    {pemenangTerakhir.nama}
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-white/70">
                    {pemenangTerakhir.sekolah}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
                    Undian belum dimulai
                  </p>
                  <p className="mt-3 text-2xl font-extrabold">
                    Menunggu pemenang pertama
                  </p>
                  <p className="mt-2 text-xs text-white/55">
                    Layar ini akan diperbarui otomatis saat operator mengundi.
                  </p>
                </div>
              )}
            </div>
            <div className="relative border-t border-white/10 bg-black/10 px-5 py-3 text-center text-[11px] text-white/60">
              {sesi.totalPemenang} dari {sesi.jumlahPemenang} pemenang terpilih
            </div>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gelap">
                Daftar pemenang sesi ini
              </h2>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                {state.pemenang.length}
              </span>
            </div>
            {state.pemenang.length > 0 ? (
              <ol className="mt-4 space-y-2">
                {state.pemenang.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/70 px-3.5 py-3"
                  >
                    <BrandMark size="xs" />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-gelap">
                        {item.nama}
                      </p>
                      <p className="mt-0.5 break-words text-[11px] text-stone-500">
                        {item.sekolah}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-xs text-stone-500">
                Belum ada pemenang. Nantikan undian di panggung acara.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-stone-600">
            Belum ada sesi hadiah
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Hasil undian akan muncul di sini setelah panitia membuat sesi.
          </p>
        </div>
      )}
    </div>
  );
}
