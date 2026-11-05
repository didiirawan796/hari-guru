"use client";

import { useState, type FormEvent } from "react";

interface ResetPasswordButtonProps {
  id: string;
  namaSekolah: string;
}

export function ResetPasswordButton({
  id,
  namaSekolah,
}: ResetPasswordButtonProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);
  const [loading, setLoading] = useState(false);

  function tutup() {
    if (loading) return;
    setOpen(false);
    setPassword("");
    setError(null);
    setSukses(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/sekolah/${id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Gagal mereset password.");
        return;
      }

      setPassword("");
      setSukses(true);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 rounded-md px-2 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-50"
      >
        Reset password
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`reset-judul-${id}`}
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id={`reset-judul-${id}`}
                  className="text-base font-bold text-gelap"
                >
                  Reset password sekolah
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">
                  Atur password baru untuk{" "}
                  <span className="font-semibold text-stone-700">
                    {namaSekolah}
                  </span>
                  . Sampaikan password baru secara langsung kepada perwakilan
                  sekolah.
                </p>
              </div>
              <button
                type="button"
                onClick={tutup}
                disabled={loading}
                aria-label="Tutup"
                className="rounded-md px-2 py-1 text-lg leading-none text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
              >
                &times;
              </button>
            </div>

            {sukses ? (
              <div className="mt-5">
                <p
                  role="status"
                  className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
                >
                  Password berhasil direset. Sekolah sudah bisa login dengan
                  password baru.
                </p>
                <button
                  type="button"
                  onClick={tutup}
                  className="mt-4 w-full rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-900"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor={`password-baru-${id}`}
                    className="mb-1 block text-xs font-semibold text-stone-600"
                  >
                    Password baru
                  </label>
                  <input
                    id={`password-baru-${id}`}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={tutup}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-merah px-4 py-2.5 text-sm font-bold text-white transition hover:bg-merah-gelap disabled:opacity-60"
                  >
                    {loading ? "Menyimpan..." : "Simpan password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
