"use client";

import { BrandMark } from "@/components/BrandMark";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-krem px-5 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <BrandMark size="lg" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-merah">
          Terjadi kendala
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gelap">
          Halaman gagal dimuat
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Silakan coba lagi. Jika masalah berlanjut, hubungi panitia acara.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-merah px-5 py-2.5 text-sm font-bold text-white transition hover:bg-merah-gelap"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-merah hover:text-merah"
          >
            Kembali ke beranda
          </a>
        </div>
      </div>
    </main>
  );
}
