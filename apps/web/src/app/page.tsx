import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const fitur = [
  {
    judul: "Data peserta terpusat",
    isi: "Setiap sekolah mengelola daftar kepala sekolah dan guru dalam satu sistem.",
  },
  {
    judul: "Kartu undian digital",
    isi: "Nomor undian unik dan kartu peserta yang mudah dibagikan lewat WhatsApp.",
  },
  {
    judul: "Live di panggung",
    isi: "Pengundian transparan, tampil serentak di layar acara dan HP peserta.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-krem">
      <section className="relative overflow-hidden bg-panggung text-white">
        <div className="absolute inset-0 bg-pattern-lembut opacity-30" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border-[3rem] border-white/[0.04]"
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-6 sm:px-8">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <div>
                <p className="text-sm font-bold tracking-wide">PGRI</p>
                <p className="text-[11px] text-white/65">Hari Guru 2026</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <Link
                href="/layar"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Layar Panggung
              </Link>
              <Link
                href="/live"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Live
              </Link>
              <Link
                href="/hasil"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Hasil
              </Link>
              <Link
                href="/kartu"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Kartu
              </Link>
              <Link
                href="/login-sekolah"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Login Sekolah
              </Link>
              <Link
                href="/daftar-sekolah"
                className="rounded-lg px-2 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                Daftar Sekolah
              </Link>
              <Link
                href="/login-admin"
                className="rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3 sm:text-sm"
              >
                Panitia
              </Link>
            </div>
          </nav>

          <div className="mx-auto max-w-3xl pb-4 pt-20 text-center sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-emas/40 bg-emas/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emas-terang">
              25 November 2026
            </span>
            <h1 className="text-balance mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Gebyar HUT PGRI
              <span className="block text-emas-terang">PC Tanjung</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-white/75 sm:text-lg">
              Berjuta cerita. Terima kasih atas dedikasi Anda. Mari meriahkan
              hari ini dengan canda tawa, aneka lomba, dan doorprize istimewa.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login-sekolah"
                className="rounded-xl bg-emas px-6 py-3.5 text-sm font-bold text-merah-lebihGelap transition hover:bg-emas-terang focus:outline-none focus:ring-4 focus:ring-emas/30"
              >
                Masuk sebagai Sekolah
              </Link>
              <Link
                href="/login-admin"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Masuk sebagai Panitia
              </Link>
              <Link
                href="/layar"
                className="rounded-xl border border-emas/45 bg-emas/10 px-6 py-3.5 text-sm font-bold text-emas-terang transition hover:bg-emas/20 focus:outline-none focus:ring-4 focus:ring-emas/25"
              >
                Lihat Layar Panggung
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Sudah punya nomor undian?{" "}
              <Link
                href="/kartu"
                className="font-semibold text-emas-terang underline decoration-emas/40 underline-offset-4 transition hover:decoration-emas-terang"
              >
                Buka kartu undian
              </Link>
            </p>
            <p className="mt-2 text-sm text-white/60">
              Belum punya akun sekolah?{" "}
              <Link
                href="/daftar-sekolah"
                className="font-semibold text-emas-terang underline decoration-emas/40 underline-offset-4 transition hover:decoration-emas-terang"
              >
                Daftar sekolah
              </Link>
            </p>
            <p className="mt-6 text-xs text-white/40">
              Panitia Hari Guru 2026 PC Kecamatan Tanjung.
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:grid-cols-3 sm:px-8">
            {fitur.map((item) => (
              <div key={item.judul} className="flex gap-3 py-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emas" />
                <div>
                  <p className="text-sm font-bold">{item.judul}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {item.isi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
