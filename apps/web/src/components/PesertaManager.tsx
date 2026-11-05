"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import type { Peran, PesertaRecord } from "@/lib/peserta";

interface EditorRow {
  key: string;
  id?: string;
  nomorUndian?: string;
  nama: string;
  peran: Peran;
}

interface PesertaManagerProps {
  initialPeserta: PesertaRecord[];
}

interface PesertaResponse {
  ok?: boolean;
  error?: string;
  peserta?: PesertaRecord[];
  diimport?: number;
}

function toEditorRows(peserta: PesertaRecord[]): EditorRow[] {
  return peserta.map((item) => ({
    key: item.id,
    id: item.id,
    nomorUndian: item.nomorUndian,
    nama: item.nama,
    peran: item.peran,
  }));
}

export function PesertaManager({ initialPeserta }: PesertaManagerProps) {
  const [rows, setRows] = useState<EditorRow[]>(() =>
    toEditorRows(initialPeserta),
  );
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{
    type: "sukses" | "error";
    text: string;
  } | null>(null);
  const counter = useRef(1);

  const totalKepsek = rows.filter((row) => row.peran === "kepsek").length;
  const totalGuru = rows.filter((row) => row.peran === "guru").length;

  function addRow() {
    if (rows.length >= 1000) {
      setMessage({ type: "error", text: "Maksimal 1000 peserta." });
      return;
    }
    setRows((current) => [
      ...current,
      {
        key: `baru-${counter.current++}`,
        nama: "",
        peran: "guru",
      },
    ]);
    setDirty(true);
    setMessage(null);
  }

  function updateRow(key: string, patch: Partial<EditorRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    setDirty(true);
    setMessage(null);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
    setDirty(true);
    setMessage(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (rows.length === 0) {
      setMessage({
        type: "error",
        text: "Minimal harus ada satu peserta sebelum menyimpan.",
      });
      return;
    }
    if (rows.some((row) => !row.nama.trim())) {
      setMessage({
        type: "error",
        text: "Semua nama peserta wajib diisi.",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/sekolah/peserta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peserta: rows.map((row) => ({
            ...(row.id ? { id: row.id } : {}),
            nama: row.nama.trim(),
            peran: row.peran,
          })),
        }),
      });
      const data = (await response.json()) as PesertaResponse;

      if (!response.ok || !data.peserta) {
        setMessage({
          type: "error",
          text: data.error ?? "Gagal menyimpan data peserta.",
        });
        return;
      }

      setRows(toEditorRows(data.peserta));
      setDirty(false);
      setMessage({
        type: "sukses",
        text: "Data peserta berhasil disimpan.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (
      dirty &&
      !window.confirm(
        "Ada perubahan yang belum disimpan. Import akan memuat data terbaru dari server dan perubahan Anda akan hilang. Lanjutkan?",
      )
    ) {
      return;
    }

    setMessage(null);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/sekolah/peserta/import", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as PesertaResponse;

      if (!response.ok || !data.peserta) {
        setMessage({
          type: "error",
          text: data.error ?? "Import gagal.",
        });
        return;
      }

      setRows(toEditorRows(data.peserta));
      setDirty(false);
      setMessage({
        type: "sukses",
        text: `${data.diimport ?? 0} peserta berhasil diimport dan ditambahkan.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Tidak dapat mengunggah file. Periksa koneksi Anda.",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total peserta", rows.length, "text-gelap"],
          ["Kepala sekolah", totalKepsek, "text-merah"],
          ["Guru", totalGuru, "text-emas-gelap"],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-stone-200 bg-white px-5 py-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              {label}
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSave}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gelap">
              Daftar kepala sekolah &amp; guru
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Nomor undian dibuat otomatis oleh sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-merah/20 bg-merah/5 px-3.5 py-2 text-sm font-bold text-merah transition hover:bg-merah/10"
          >
            + Tambah baris
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-stone-600">
              Belum ada peserta
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Tambahkan baris secara manual atau import file Excel/CSV.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 border-t border-stone-100 p-4 md:hidden">
              {rows.map((row, index) => (
                <div
                  key={`m-${row.key}`}
                  className="rounded-xl border border-stone-200 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    {row.nomorUndian ? (
                      <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs font-bold text-stone-600">
                        {row.nomorUndian}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">Otomatis</span>
                    )}
                    <div className="flex items-center gap-1">
                      {row.nomorUndian ? (
                        <Link
                          href={`/kartu/${row.nomorUndian}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg px-2 py-1 text-xs font-bold text-merah hover:bg-merah/5"
                        >
                          Kartu
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label
                      htmlFor={`nama-m-${row.key}`}
                      className="mb-1 block text-[11px] font-semibold text-stone-600"
                    >
                      Nama peserta {index + 1}
                    </label>
                    <input
                      id={`nama-m-${row.key}`}
                      value={row.nama}
                      onChange={(event) =>
                        updateRow(row.key, { nama: event.target.value })
                      }
                      maxLength={120}
                      placeholder="Nama lengkap"
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-gelap outline-none transition focus:border-merah focus:ring-2 focus:ring-merah/10"
                    />
                  </div>

                  <div className="mt-2.5">
                    <label
                      htmlFor={`peran-m-${row.key}`}
                      className="mb-1 block text-[11px] font-semibold text-stone-600"
                    >
                      Peran peserta {index + 1}
                    </label>
                    <select
                      id={`peran-m-${row.key}`}
                      value={row.peran}
                      onChange={(event) =>
                        updateRow(row.key, {
                          peran: event.target.value as Peran,
                        })
                      }
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-gelap outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
                    >
                      <option value="guru">Guru</option>
                      <option value="kepsek">Kepala Sekolah</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                    <th className="px-5 py-3 font-semibold">Nomor</th>
                    <th className="px-4 py-3 font-semibold">Nama</th>
                    <th className="px-4 py-3 font-semibold">Peran</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.key}
                      className="border-t border-stone-100 align-middle"
                    >
                      <td className="whitespace-nowrap px-5 py-3">
                        {row.nomorUndian ? (
                          <span className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs font-bold text-stone-600">
                            {row.nomorUndian}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">
                            Otomatis
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`nama-${row.key}`}>
                          Nama peserta {index + 1}
                        </label>
                        <input
                          id={`nama-${row.key}`}
                          value={row.nama}
                          onChange={(event) =>
                            updateRow(row.key, { nama: event.target.value })
                          }
                          maxLength={120}
                          placeholder="Nama lengkap"
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-gelap outline-none transition focus:border-merah focus:ring-2 focus:ring-merah/10"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`peran-${row.key}`}>
                          Peran peserta {index + 1}
                        </label>
                        <select
                          id={`peran-${row.key}`}
                          value={row.peran}
                          onChange={(event) =>
                            updateRow(row.key, {
                              peran: event.target.value as Peran,
                            })
                          }
                          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-gelap outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
                        >
                          <option value="guru">Guru</option>
                          <option value="kepsek">Kepala Sekolah</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.nomorUndian ? (
                            <Link
                              href={`/kartu/${row.nomorUndian}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-merah transition hover:bg-merah/5"
                            >
                              Kartu
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 px-5 py-4">
          <p className="text-xs text-stone-500">
            {dirty ? "Ada perubahan belum disimpan." : "Semua perubahan tersimpan."}
          </p>
          <button
            type="submit"
            disabled={saving || rows.length === 0}
            className="rounded-lg bg-merah px-5 py-2.5 text-sm font-bold text-white transition hover:bg-merah-gelap disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan daftar peserta"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gelap">
              Import Excel / CSV
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-500">
              Import akan <strong>menambahkan</strong> peserta baru. Gunakan
              template agar format kolom sesuai. Maksimal 2 MB dan 1000 baris.
            </p>
          </div>
          <a
            href="/api/sekolah/template"
            className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:border-merah hover:text-merah"
          >
            Download template Excel
          </a>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <label
            htmlFor="file-import"
            className="mb-2 block text-xs font-semibold text-stone-600"
          >
            Pilih file .xlsx atau .csv
          </label>
          <input
            id="file-import"
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={handleImport}
            disabled={importing}
            className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-merah file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-merah-gelap disabled:opacity-60"
          />
          {importing ? (
            <p className="mt-2 text-xs font-semibold text-merah">
              Memproses file...
            </p>
          ) : null}
        </div>
      </section>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === "sukses"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
