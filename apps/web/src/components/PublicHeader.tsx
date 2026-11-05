import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { PublicNavLinks } from "./PublicNavLinks";

export function PublicHeader() {
  return (
    <header className="tanpa-cetak border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark size="sm" />
          <span>
            <span className="block text-sm font-extrabold tracking-tight text-gelap">
              Undian Hari Guru 2026
            </span>
            <span className="block text-[11px] text-stone-500">
              PC Kecamatan Tanjung
            </span>
          </span>
        </Link>
        <PublicNavLinks />
      </div>
    </header>
  );
}
