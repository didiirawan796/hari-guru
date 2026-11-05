import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterSchoolForm } from "@/components/RegisterSchoolForm";

export const metadata: Metadata = {
  title: "Daftar Sekolah",
};

export default function DaftarSekolahPage() {
  return (
    <AuthShell
      mode="sekolah"
      eyebrow="Pendaftaran Sekolah"
      title="Daftarkan sekolah Anda"
      description="Buat akun untuk mengelola data kepala sekolah dan guru. Akun langsung aktif setelah didaftarkan."
      footer={
        <p className="mt-6 text-center text-sm text-stone-500">
          Sudah punya akun?{" "}
          <Link
            href="/login-sekolah"
            className="font-semibold text-merah underline decoration-merah/25 underline-offset-4 hover:decoration-merah"
          >
            Masuk di sini
          </Link>
        </p>
      }
    >
      <RegisterSchoolForm />
    </AuthShell>
  );
}
