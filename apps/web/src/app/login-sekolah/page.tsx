import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login Sekolah",
};

export default async function LoginSekolahPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <AuthShell
      mode="sekolah"
      title="Selamat datang kembali"
      description="Gunakan username dan password akun sekolah Anda. Belum punya akun? Daftar gratis di bawah."
    >
      <LoginForm mode="sekolah" next={next} />
      <p className="mt-5 border-t border-stone-100 pt-5 text-center text-sm text-stone-500">
        Belum terdaftar?{" "}
        <Link
          href="/daftar-sekolah"
          className="font-semibold text-merah underline decoration-merah/25 underline-offset-4 hover:decoration-merah"
        >
          Daftar sekolah
        </Link>
      </p>
    </AuthShell>
  );
}
