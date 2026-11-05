"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { normalisasiNomorUndian } from "@/lib/nomor";

export function CekKartuForm() {
  const router = useRouter();
  const [nomor, setNomor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasil = normalisasiNomorUndian(nomor);

    if (!hasil) {
      setError('Masukkan nomor undian, misalnya "KEC-0001" atau "1".');
      return;
    }

    setError(null);
    setLoading(true);
    router.push(`/kartu/${hasil}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label
        htmlFor="nomor-undian"
        className="block text-xs font-semibold text-stone-600"
      >
        Nomor undian
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="nomor-undian"
          value={nomor}
          onChange={(event) => {
            setNomor(event.target.value);
            setError(null);
          }}
          autoComplete="off"
          placeholder="KEC-0001"
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 font-mono text-base font-bold uppercase tracking-wide text-gelap outline-none transition focus:border-merah focus:ring-2 focus:ring-merah/10"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-merah px-5 py-3 text-sm font-bold text-white transition hover:bg-merah-gelap disabled:opacity-60"
        >
          {loading ? "Membuka..." : "Buka kartu"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        <p className="text-xs text-stone-500">
          Nomor undian tertera pada kartu atau pengumuman panitia.
        </p>
      )}
    </form>
  );
}
