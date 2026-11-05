import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { LogoutButton } from "./LogoutButton";

interface PanelShellProps {
  area: string;
  nama: string;
  roleLabel: string;
  children: ReactNode;
}

export function PanelShell({
  area,
  nama,
  roleLabel,
  children,
}: PanelShellProps) {
  return (
    <main className="min-h-dvh bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <Link
                href="/"
                className="text-sm font-extrabold tracking-tight text-gelap hover:text-merah"
              >
                Undian Hari Guru 2026
              </Link>
              <p className="text-xs text-stone-500">{area}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gelap">{nama}</p>
              <p className="text-[11px] uppercase tracking-wide text-stone-400">
                {roleLabel}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
    </main>
  );
}
