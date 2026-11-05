import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelShell } from "@/components/PanelShell";
import { PesertaManager } from "@/components/PesertaManager";
import { listPeserta } from "@/lib/peserta";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard Sekolah",
};

export default async function DashboardSekolahPage() {
  const session = await requireRole(["sekolah"]);
  if (!session.sekolahId) {
    redirect("/login-sekolah");
  }

  const peserta = await listPeserta(session.sekolahId);

  return (
    <PanelShell
      area="Dashboard Sekolah"
      nama={session.namaTampilan}
      roleLabel="Perwakilan Sekolah"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-merah">
            Data Peserta
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
            {session.namaTampilan}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Lengkapi kepala sekolah dan guru. Nomor undian dibuat otomatis.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
            Username
          </p>
          <p className="font-mono text-xs font-bold text-stone-700">
            {session.username}
          </p>
        </div>
      </div>

      <div className="mt-7">
        <PesertaManager initialPeserta={peserta} />
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-amber-800">
          Periksa kembali ejaan nama sebelum acara. Nomor undian bersifat tetap
          dan tidak berubah saat nama diperbarui. Peserta yang sudah menang
          tidak dapat dihapus.
        </p>
      </div>
    </PanelShell>
  );
}
