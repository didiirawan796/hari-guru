import type { Metadata } from "next";
import { CekKartuForm } from "@/components/CekKartuForm";
import { PublicHeader } from "@/components/PublicHeader";

export const metadata: Metadata = {
  title: "Cek Kartu Undian",
};

const langkah = [
  {
    judul: "Masukkan nomor",
    isi: 'Ketik nomor undian Anda, misalnya "KEC-0001" atau cukup "1".',
  },
  {
    judul: "Periksa data",
    isi: "Pastikan nama, sekolah, dan peran sudah sesuai sebelum disimpan.",
  },
  {
    judul: "Simpan atau bagikan",
    isi: "Cetak kartu, simpan sebagai PDF, atau salin tautan untuk dibagikan.",
  },
];

export default function CekKartuPage() {
  return (
    <main className="min-h-dvh bg-krem bg-pattern-lembut">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-merah">
            Kartu Undian Digital
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gelap sm:text-4xl">
            Cek kartu undian Anda
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500 sm:text-base">
            Masukkan nomor undian untuk membuka kartu peserta Hari Guru 2026.
            Tidak perlu login dan tidak ada data sensitif yang ditampilkan.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-kartu sm:p-7">
          <CekKartuForm />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {langkah.map((item, index) => (
            <div
              key={item.judul}
              className="rounded-xl border border-stone-200 bg-white/70 p-4"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-merah/10 text-xs font-extrabold text-merah">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-bold text-gelap">{item.judul}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {item.isi}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          Nomor undian hanya diberikan oleh panitia atau sekolah Anda.
        </p>
      </div>
    </main>
  );
}
