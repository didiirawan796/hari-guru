import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

interface AuthShellProps {
  mode: "sekolah" | "admin";
  title: string;
  description: string;
  eyebrow?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthShell({
  mode,
  title,
  description,
  eyebrow,
  footer,
  children,
}: AuthShellProps) {
  const isSchool = mode === "sekolah";

  return (
    <main className="min-h-dvh bg-krem lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative overflow-hidden bg-panggung px-6 py-8 text-white lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="absolute inset-0 bg-pattern-lembut opacity-25" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full border-[3rem] border-white/[0.04]"
        />

        <div className="relative flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p className="text-sm font-bold tracking-wide">PGRI</p>
            <p className="text-[11px] text-white/60">Hari Guru 2026</p>
          </div>
        </div>

        <div className="relative mt-14 max-w-xl lg:mt-0">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emas-terang">
            {isSchool ? "Portal Sekolah" : "Portal Panitia"}
          </p>
          <h1 className="text-balance mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">
            {isSchool
              ? "Satu data guru, satu kesempatan menang."
              : "Kelola acara dengan tenang dan transparan."}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            {isSchool
              ? "Masuk untuk melengkapi data kepala sekolah dan guru. Nomor undian dibuat otomatis oleh sistem."
              : "Masuk untuk memantau data kecamatan dan menjalankan pengundian di panggung acara."}
          </p>
        </div>

        <div className="relative mt-12 grid grid-cols-2 gap-3 text-xs text-white/60 sm:max-w-sm lg:mt-0">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-lg font-bold text-white">25 Nov</p>
            <p className="mt-0.5">Peringatan Hari Guru</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-lg font-bold text-white">2026</p>
            <p className="mt-0.5">PC Kecamatan Tanjung</p>
          </div>
        </div>
      </section>

      <section className="flex min-h-[60dvh] items-center justify-center px-5 py-12 sm:px-8 lg:min-h-dvh">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <BrandMark size="sm" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-merah">
            {eyebrow ?? (isSchool ? "Login Sekolah" : "Login Panitia")}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gelap sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            {description}
          </p>

          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-kartu sm:p-7">
            {children}
          </div>

          {footer ?? (
            <p className="mt-6 text-center text-sm text-stone-500">
              {isSchool ? "Panitia acara?" : "Perwakilan sekolah?"}{" "}
              <Link
                href={isSchool ? "/login-admin" : "/login-sekolah"}
                className="font-semibold text-merah underline decoration-merah/25 underline-offset-4 hover:decoration-merah"
              >
                {isSchool ? "Masuk di sini" : "Masuk di sini"}
              </Link>
            </p>
          )}
          <p className="mt-3 text-center text-xs text-stone-400">
            <Link href="/" className="hover:text-stone-600">
              &larr; Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
