"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  OperatorData,
  PemenangRecord,
  SesiRingkas,
} from "@/lib/undian-types";

interface OperatorConsoleProps {
  initialData: OperatorData;
}

interface Message {
  type: "sukses" | "error";
  text: string;
}

function statusBadge(status: SesiRingkas["status"]) {
  if (status === "berjalan") {
    return "bg-amber-100 text-amber-800";
  }
  if (status === "selesai") {
    return "bg-emerald-100 text-emerald-800";
  }
  return "bg-stone-100 text-stone-600";
}

function statusText(status: SesiRingkas["status"]) {
  if (status === "berjalan") return "Berjalan";
  if (status === "selesai") return "Selesai";
  return "Belum";
}

export function OperatorConsole({ initialData }: OperatorConsoleProps) {
  const [data, setData] = useState<OperatorData>(initialData);
  const [selectedId, setSelectedId] = useState<string>(
    initialData.live.sesi?.id ?? initialData.sesi[0]?.id ?? "",
  );
  const [busy, setBusy] = useState<"mulai" | "undi" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const selected = data.sesi.find((item) => item.id === selectedId) ?? null;
  const live = data.live;
  const liveSesi = live.sesi;
  const isLiveSelected = Boolean(liveSesi && liveSesi.id === selectedId);
  const canDraw = Boolean(
    isLiveSelected &&
      liveSesi &&
      liveSesi.status === "berjalan" &&
      liveSesi.totalPemenang < liveSesi.jumlahPemenang,
  );
  const canStart = Boolean(
    selected && selected.status !== "berjalan" && selected.status !== "selesai",
  );
  const pemenangTerakhir = live.pemenang[live.pemenang.length - 1] ?? null;

  function applyPayload(payload: {
    sesi?: SesiRingkas[];
    live?: OperatorData["live"];
  }) {
    if (Array.isArray(payload.sesi) && payload.live) {
      setData({ sesi: payload.sesi, live: payload.live });
    }
  }

  async function handleMulai() {
    if (!selected) return;
    setBusy("mulai");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/operator/sesi/${selected.id}/mulai`,
        { method: "POST" },
      );
      const payload = (await response.json()) as OperatorData & {
        error?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: payload.error ?? "Gagal membuka sesi.",
        });
        return;
      }

      applyPayload(payload);
      setMessage({
        type: "sukses",
        text: `Sesi ${selected.urutan} — ${selected.namaHadiah} dibuka. Layar panggung sudah diperbarui.`,
      });
    } catch {
      setMessage({ type: "error", text: "Tidak dapat menghubungi server." });
    } finally {
      setBusy(null);
    }
  }

  async function handleUndi() {
    if (!selected) return;
    setBusy("undi");
    setMessage(null);

    try {
      const response = await fetch("/api/operator/undi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesiId: selected.id }),
      });
      const payload = (await response.json()) as OperatorData & {
        error?: string;
        pemenang?: PemenangRecord;
      };

      if (!response.ok || !payload.pemenang) {
        setMessage({
          type: "error",
          text: payload.error ?? "Gagal menjalankan undian.",
        });
        return;
      }

      applyPayload(payload);
      setMessage({
        type: "sukses",
        text: `Pemenang #${payload.pemenang.hadiahKe}: ${payload.pemenang.nomorUndian} — ${payload.pemenang.nama} (${payload.pemenang.sekolah}).`,
      });
    } catch {
      setMessage({ type: "error", text: "Tidak dapat menghubungi server." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-merah">
            Kontrol Undian
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
            Panel operator
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Buka sesi, jalankan undian, dan pantau pemenang secara langsung.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/layar"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:border-merah hover:text-merah"
          >
            Buka layar panggung
          </Link>
          <Link
            href="/hasil"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:border-merah hover:text-merah"
          >
            Rekap hasil
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="text-base font-bold text-gelap">Sesi hadiah</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Pilih sesi yang akan dijalankan.
            </p>
          </div>

          {data.sesi.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-stone-500">
              Belum ada sesi hadiah. Buat sesi melalui dashboard admin.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data.sesi.map((sesi) => {
                const active = sesi.id === selectedId;
                return (
                  <li key={sesi.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(sesi.id);
                        setMessage(null);
                      }}
                      className={`w-full px-5 py-4 text-left transition ${
                        active ? "bg-amber-50" : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gelap">
                            {sesi.urutan}. {sesi.namaHadiah}
                          </p>
                          <p className="mt-0.5 text-[11px] text-stone-500">
                            {sesi.totalPemenang} dari {sesi.jumlahPemenang}{" "}
                            pemenang
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge(
                            sesi.status,
                          )}`}
                        >
                          {statusText(sesi.status)}
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-merah"
                          style={{
                            width: `${Math.min(
                              100,
                              (sesi.totalPemenang / sesi.jumlahPemenang) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                      Sesi terpilih
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold text-gelap">
                      {selected.urutan}. {selected.namaHadiah}
                    </h2>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Target {selected.jumlahPemenang} pemenang &middot;{" "}
                      {selected.totalPemenang} sudah terpilih
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadge(
                      selected.status,
                    )}`}
                  >
                    {statusText(selected.status)}
                  </span>
                </div>

                {!isLiveSelected ? (
                  <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
                    Sesi ini belum menjadi sesi aktif. Tekan{" "}
                    <strong>Mulai sesi</strong> agar tampil di layar panggung
                    dan dapat diundi.
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleMulai}
                    disabled={!canStart || busy !== null}
                    className="rounded-lg border border-merah/30 bg-merah/5 px-4 py-2.5 text-sm font-bold text-merah transition hover:bg-merah/10 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-300"
                  >
                    {busy === "mulai" ? "Membuka..." : "Mulai sesi"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUndi}
                    disabled={!canDraw || busy !== null}
                    className="rounded-lg bg-merah px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-merah-gelap disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {busy === "undi" ? "Mengundi..." : "Undi sekarang"}
                  </button>
                  {liveSesi && liveSesi.totalPemenang > 0 ? (
                    <a
                      href={`/api/panitia/export/pemenang?sesi=${liveSesi.id}`}
                      className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-merah hover:text-merah"
                    >
                      Export CSV
                    </a>
                  ) : null}
                </div>

                {selected.status === "selesai" ? (
                  <p className="mt-3 text-xs text-emerald-700">
                    Sesi ini sudah selesai. Semua pemenang terkunci.
                  </p>
                ) : null}
                {isLiveSelected &&
                liveSesi &&
                liveSesi.totalPemenang >= liveSesi.jumlahPemenang ? (
                  <p className="mt-3 text-xs text-emerald-700">
                    Target pemenang sudah terpenuhi.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="py-6 text-center text-sm text-stone-500">
                Pilih sesi hadiah terlebih dahulu.
              </p>
            )}

            {message ? (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                  message.type === "sukses"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gelap">
                  Pemenang sesi aktif
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {liveSesi
                    ? `${liveSesi.namaHadiah} · ${live.pemenang.length} pemenang`
                    : "Belum ada sesi aktif"}
                </p>
              </div>
              {pemenangTerakhir ? (
                <span className="rounded-md bg-merah/10 px-2.5 py-1 font-mono text-xs font-extrabold text-merah">
                  {pemenangTerakhir.nomorUndian}
                </span>
              ) : null}
            </div>

            {live.pemenang.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-stone-500">
                Belum ada pemenang pada sesi aktif.
              </p>
            ) : (
              <ol className="divide-y divide-stone-100">
                {[...live.pemenang].reverse().map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-gelap">
                        {item.hadiahKe}. {item.nama}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {item.nomorUndian} &middot; {item.sekolah}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600">
                      {item.peran === "kepsek" ? "Kepsek" : "Guru"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-amber-800">
          Hanya role <strong>operator</strong> yang dapat menjalankan undian.
          Peserta yang sudah pernah menang otomatis dikecualikan, dan hasil
          undian langsung tersimpan serta terkunci di database.
        </p>
      </div>
    </div>
  );
}
