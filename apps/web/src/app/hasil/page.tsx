import type { Metadata } from "next";
import { PublicHeader } from "@/components/PublicHeader";
import { getHasilData } from "@/lib/undian";

export const metadata: Metadata = {
  title: "Rekap Hasil Undian",
};

export const dynamic = "force-dynamic";

const formatWaktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function HasilPage() {
  const hasil = await getHasilData();
  const totalPemenang = hasil.reduce(
    (total, sesi) => total + sesi.pemenang.length,
    0,
  );

  return (
    <main className="min-h-dvh bg-krem bg-pattern-lembut">
      <PublicHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-merah">
              Rekap Resmi
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gelap sm:text-4xl">
              Hasil undian Hari Guru 2026
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              Daftar pemenang doorprize per sesi. Pemenang bersifat final dan
              tidak dapat mengikuti undian berikutnya.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                Sesi
              </p>
              <p className="text-xl font-extrabold text-gelap">{hasil.length}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                Pemenang
              </p>
              <p className="text-xl font-extrabold text-merah">
                {totalPemenang}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {hasil.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
              <p className="text-sm font-semibold text-stone-600">
                Belum ada sesi hadiah
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Hasil undian akan tampil di sini setelah acara berlangsung.
              </p>
            </div>
          ) : (
            hasil.map((sesi) => (
              <section
                key={sesi.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                      Sesi {sesi.urutan}
                    </p>
                    <h2 className="mt-0.5 text-lg font-extrabold text-gelap">
                      {sesi.namaHadiah}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                      {sesi.pemenang.length}/{sesi.jumlahPemenang} pemenang
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        sesi.status === "selesai"
                          ? "bg-emerald-100 text-emerald-800"
                          : sesi.status === "berjalan"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {sesi.status === "selesai"
                        ? "Selesai"
                        : sesi.status === "berjalan"
                          ? "Berjalan"
                          : "Belum"}
                    </span>
                  </div>
                </div>

                {sesi.pemenang.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-stone-500">
                    Belum ada pemenang pada sesi ini.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-stone-100 md:hidden">
                      {sesi.pemenang.map((pemenang) => (
                        <li key={pemenang.id} className="px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-gelap">
                                {pemenang.nama}
                              </p>
                              <p className="mt-0.5 break-words text-[11px] text-stone-500">
                                {pemenang.sekolah}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-600">
                              {pemenang.nomorUndian}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                            <span>#{pemenang.hadiahKe}</span>
                            <span>
                              {pemenang.peran === "kepsek"
                                ? "Kepala Sekolah"
                                : "Guru"}
                            </span>
                            <span>
                              {formatWaktu.format(
                                new Date(pemenang.waktuMenang),
                              )}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[680px] text-sm">
                        <thead>
                          <tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                            <th className="px-5 py-3 font-semibold">#</th>
                            <th className="px-4 py-3 font-semibold">Nomor</th>
                            <th className="px-4 py-3 font-semibold">Nama</th>
                            <th className="px-4 py-3 font-semibold">Sekolah</th>
                            <th className="px-4 py-3 font-semibold">Peran</th>
                            <th className="px-5 py-3 text-right font-semibold">
                              Waktu
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sesi.pemenang.map((pemenang) => (
                            <tr
                              key={pemenang.id}
                              className="border-t border-stone-100"
                            >
                              <td className="px-5 py-3 text-xs text-stone-400">
                                {pemenang.hadiahKe}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-600">
                                  {pemenang.nomorUndian}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gelap">
                                {pemenang.nama}
                              </td>
                              <td className="px-4 py-3 text-stone-600">
                                {pemenang.sekolah}
                              </td>
                              <td className="px-4 py-3 text-stone-600">
                                {pemenang.peran === "kepsek"
                                  ? "Kepala Sekolah"
                                  : "Guru"}
                              </td>
                              <td className="whitespace-nowrap px-5 py-3 text-right text-[11px] text-stone-500">
                                {formatWaktu.format(
                                  new Date(pemenang.waktuMenang),
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-stone-400">
          Rekap ini hanya menampilkan pemenang resmi panitia.
        </p>
      </div>
    </main>
  );
}
