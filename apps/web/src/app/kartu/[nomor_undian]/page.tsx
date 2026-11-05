import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { KartuActions } from "@/components/KartuActions";
import { PublicHeader } from "@/components/PublicHeader";
import { normalisasiNomorUndian } from "@/lib/nomor";
import { getPesertaByNomor } from "@/lib/peserta";

export const dynamic = "force-dynamic";

interface KartuPageProps {
  params: Promise<{ nomor_undian: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kartu Peserta",
  };
}

export default async function KartuPage({ params }: KartuPageProps) {
  const { nomor_undian } = await params;
  const nomor = normalisasiNomorUndian(nomor_undian);

  if (!nomor) {
    notFound();
  }

  const peserta = await getPesertaByNomor(nomor);
  if (!peserta) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-krem bg-pattern-lembut print:bg-white">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="tanpa-cetak mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/kartu"
              className="text-xs font-semibold text-stone-500 transition hover:text-merah"
            >
              &larr; Cek nomor lain
            </Link>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-gelap sm:text-2xl">
              Kartu undian resmi
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Simpan atau cetak kartu ini sebelum hari acara.
            </p>
          </div>
          <KartuActions nomorUndian={peserta.nomorUndian} />
        </div>

        <article className="kartu-cetak mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-emas/50 bg-white shadow-kartu print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <div className="relative overflow-hidden bg-panggung px-6 py-5 text-white sm:px-8 print:bg-merah">
            <div className="absolute inset-0 bg-pattern-lembut opacity-30" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border-[1.4rem] border-white/[0.05]"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" />
                <div>
                  <p className="text-sm font-extrabold tracking-wide">
                    HARI GURU 2026
                  </p>
                  <p className="text-[11px] text-white/70">
                    Undian doorprize PC Kecamatan Tanjung
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
                Kartu Peserta
              </span>
            </div>
          </div>

          <div className="px-6 py-9 sm:px-8 sm:py-11">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                Nama
              </p>
              <p className="mt-1 break-words text-3xl font-extrabold leading-tight tracking-tight text-gelap sm:text-4xl">
                {peserta.nama}
              </p>

              <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
                Sekolah
              </p>
              <p className="mt-1 break-words text-base font-semibold text-stone-700">
                {peserta.sekolah}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-krem px-6 py-4 sm:px-8">
            <p className="text-xs font-bold text-stone-600">
              Rabu, 25 November 2026
            </p>
            <p className="text-[11px] text-stone-500">
              Simpan kartu ini sampai acara selesai.
            </p>
          </div>
        </article>

        <div className="tanpa-cetak mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-800">
            Kartu ini bukan bukti pemenang. Pemenang hanya ditetapkan melalui
            pengundian resmi panitia di panggung acara. Gunakan tombol
            &quot;Cetak / Simpan PDF&quot; untuk menyimpan kartu, atau
            &quot;Salin tautan&quot; untuk membagikannya lewat WhatsApp.
          </p>
        </div>
      </div>
    </main>
  );
}
