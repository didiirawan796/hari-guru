import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login Panitia",
};

export default async function LoginAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <AuthShell
      mode="admin"
      title="Masuk ke panel panitia"
      description="Akun admin kecamatan dan operator menggunakan halaman ini."
    >
      <LoginForm mode="admin" next={next} />
    </AuthShell>
  );
}
