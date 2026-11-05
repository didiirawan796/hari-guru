import type { Metadata } from "next";
import Link from "next/link";
import { CreateSchoolForm } from "@/components/CreateSchoolForm";
import { CreateSesiForm } from "@/components/CreateSesiForm";
import { DeleteSesiButton } from "@/components/DeleteSesiButton";
import { PanelShell } from "@/components/PanelShell";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";
import { getAdminDashboard, type SesiAdminRow } from "@/lib/admin";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin Kecamatan",
};

function StatusBadge({ status }: { status: SesiAdminRow["status"] }) {
  const styles = {
    belum: "bg-stone-100 text-stone-600",
    berjalan: "bg-amber-100 text-amber-800",
    selesai: "bg-emerald-100 text-emerald-800",
  };
  const labels = {
    belum: "Belum",
    berjalan: "Berjalan",
    selesai: "Selesai",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sekolah?: string | string[] }>;
}) {
  const session = await requireRole(["admin"]);
  const params = await searchParams;
  const selectedId =
    typeof params.sekolah === "string" ? params.sekolah : undefined;
  const data = await getAdminDashboard(selectedId);

  const ringkasan = [
    ["Sekolah terdaftar", data.ringkasan.sekolah],
    ["Total peserta", data.ringkasan.peserta],
    ["Sesi hadiah", data.ringkasan.sesi],
    ["Pemenang", data.ringkasan.pemenang],
  ] as const;

  return (
    <PanelShell
      area="Admin Kecamatan"
      nama={session.namaTampilan}
      roleLabel="Administrator"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-merah">
            Ringkasan Acara
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
            Dashboard Kecamatan
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Monitoring data peserta dan sesi hadiah Hari Guru 2026.
          </p>
        </div>
        <a
          href="/api/admin/export/peserta"
          className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-bold text-stone-700 transition hover:border-merah hover:text-merah"
        >
          Export semua peserta (CSV)
        </a>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ringkasan.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              {label}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-gelap">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gelap">
                  Data sekolah
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Klik &quot;Lihat peserta&quot; untuk memeriksa data per
                  sekolah.
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                {data.sekolah.length} sekolah
              </span>
            </div>

            {data.sekolah.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-stone-600">
                  Belum ada akun sekolah
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Buat akun sekolah melalui formulir di samping.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-stone-100 md:hidden">
                  {data.sekolah.map((sekolah) => (
                    <li key={sekolah.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-gelap">
                            {sekolah.namaSekolah}
                          </p>
                          <p className="mt-0.5 break-all font-mono text-[11px] text-stone-500">
                            {sekolah.username}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600">
                          {sekolah.totalPeserta} peserta
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
                        <span>Kepsek: {sekolah.totalKepsek}</span>
                        <span>Guru: {sekolah.totalGuru}</span>
                        <span>Total: {sekolah.totalPeserta}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1">
                        <Link
                          href={`/admin?sekolah=${sekolah.id}`}
                          className="rounded-md bg-stone-100 px-2.5 py-1.5 text-[11px] font-bold text-merah"
                        >
                          Lihat peserta
                        </Link>
                        <a
                          href={`/api/admin/export/peserta?sekolah=${sekolah.id}`}
                          className="rounded-md px-2.5 py-1.5 text-[11px] font-bold text-stone-500 hover:bg-stone-100"
                        >
                          Export
                        </a>
                        <ResetPasswordButton
                          id={sekolah.id}
                          namaSekolah={sekolah.namaSekolah}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                        <th className="px-5 py-3 font-semibold">Sekolah</th>
                        <th className="px-4 py-3 font-semibold">Username</th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Kepsek
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Guru
                        </th>
                        <th className="px-3 py-3 text-center font-semibold">
                          Total
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sekolah.map((sekolah) => (
                        <tr
                          key={sekolah.id}
                          className={`border-t border-stone-100 ${
                            data.sekolahTerpilih?.id === sekolah.id
                              ? "bg-amber-50/60"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-3 font-semibold text-gelap">
                            {sekolah.namaSekolah}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-stone-500">
                            {sekolah.username}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-600">
                            {sekolah.totalKepsek}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-600">
                            {sekolah.totalGuru}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gelap">
                            {sekolah.totalPeserta}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Link
                                href={`/admin?sekolah=${sekolah.id}`}
                                className="rounded-md px-2 py-1 text-[11px] font-bold text-merah hover:bg-merah/5"
                              >
                                Lihat peserta
                              </Link>
                              <a
                                href={`/api/admin/export/peserta?sekolah=${sekolah.id}`}
                                className="rounded-md px-2 py-1 text-[11px] font-bold text-stone-500 hover:bg-stone-100"
                              >
                                Export
                              </a>
                              <ResetPasswordButton
                                id={sekolah.id}
                                namaSekolah={sekolah.namaSekolah}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {data.sekolahTerpilih ? (
            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-gelap">
                    Peserta — {data.sekolahTerpilih.namaSekolah}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {data.pesertaTerpilih.length} peserta terdaftar
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/export/peserta?sekolah=${data.sekolahTerpilih.id}`}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 hover:border-merah hover:text-merah"
                  >
                    Export sekolah ini
                  </a>
                  <Link
                    href="/admin"
                    className="rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-400 hover:text-stone-700"
                  >
                    Tutup
                  </Link>
                </div>
              </div>

              {data.pesertaTerpilih.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-stone-500">
                  Sekolah ini belum menginput peserta.
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-stone-100 md:hidden">
                    {data.pesertaTerpilih.map((peserta) => (
                      <li
                        key={peserta.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium text-gelap">
                            {peserta.nama}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-bold text-stone-500">
                            {peserta.nomorUndian}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            peserta.peran === "kepsek"
                              ? "bg-merah/10 text-merah"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {peserta.peran === "kepsek" ? "Kepsek" : "Guru"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
                          <th className="px-5 py-3 font-semibold">Nomor</th>
                          <th className="px-4 py-3 font-semibold">Nama</th>
                          <th className="px-5 py-3 text-right font-semibold">
                            Peran
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pesertaTerpilih.map((peserta) => (
                          <tr
                            key={peserta.id}
                            className="border-t border-stone-100"
                          >
                            <td className="px-5 py-2.5">
                              <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-600">
                                {peserta.nomorUndian}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-medium text-gelap">
                              {peserta.nama}
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  peserta.peran === "kepsek"
                                    ? "bg-merah/10 text-merah"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {peserta.peran === "kepsek"
                                  ? "Kepsek"
                                  : "Guru"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-base font-bold text-gelap">
              Buat akun sekolah
            </h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-stone-500">
              Akun digunakan perwakilan sekolah untuk menginput data peserta.
            </p>
            <CreateSchoolForm />
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="text-base font-bold text-gelap">Tambah sesi hadiah</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-stone-500">
              Sesi akan dijalankan oleh operator pada halaman undian.
            </p>
            <CreateSesiForm />
          </section>

          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-base font-bold text-gelap">Sesi hadiah</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Diurutkan sesuai jadwal undian.
              </p>
            </div>
            {data.sesi.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-stone-500">
                Belum ada sesi hadiah.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {data.sesi.map((sesi) => (
                  <li key={sesi.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gelap">
                          {sesi.urutan}. {sesi.namaHadiah}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-500">
                          {sesi.jumlahPemenang} pemenang target &middot;{" "}
                          {sesi.totalPemenang} terpilih
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={sesi.status} />
                        {sesi.totalPemenang > 0 ? (
                          <a
                            href={`/api/panitia/export/pemenang?sesi=${sesi.id}`}
                            className="rounded-md px-2 py-1 text-[11px] font-bold text-stone-500 transition hover:bg-stone-100 hover:text-merah"
                          >
                            CSV
                          </a>
                        ) : null}
                        <DeleteSesiButton
                          id={sesi.id}
                          disabled={
                            sesi.status === "berjalan" ||
                            sesi.totalPemenang > 0
                          }
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PanelShell>
  );
}
