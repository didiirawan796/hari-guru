import Link from "next/link";
import { CekKartuForm } from "@/components/CekKartuForm";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-krem bg-pattern-lembut">
      <PublicHeader />

      <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="font-mono text-5xl font-extrabold text-merah/25">404</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
          Kartu tidak ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">
          Nomor undian tidak terdaftar atau sudah tidak berlaku. Periksa kembali
          nomor pada kartu Anda, atau hubungi panitia sekolah.
        </p>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-kartu sm:p-7">
          <CekKartuForm />
        </div>

        <p className="mt-8 text-xs text-stone-400">
          <Link
            href="/"
            className="font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-merah"
          >
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
