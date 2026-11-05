import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/layar", label: "Layar" },
  { href: "/live", label: "Live" },
  { href: "/hasil", label: "Hasil" },
  { href: "/kartu", label: "Kartu" },
];

interface PublicNavLinksProps {
  theme?: "light" | "dark";
  includeHome?: boolean;
}

export function PublicNavLinks({
  theme = "light",
  includeHome = true,
}: PublicNavLinksProps) {
  const itemClass =
    theme === "dark"
      ? "rounded-lg px-2.5 py-2 text-xs font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
      : "rounded-lg px-2.5 py-2 text-xs font-bold text-stone-600 transition hover:bg-stone-100 hover:text-merah";

  return (
    <nav aria-label="Navigasi utama" className="flex flex-wrap items-center gap-1">
      {links
        .filter((link) => includeHome || link.href !== "/")
        .map((link) => (
          <Link key={link.href} href={link.href} className={itemClass}>
            {link.label}
          </Link>
        ))}
    </nav>
  );
}
