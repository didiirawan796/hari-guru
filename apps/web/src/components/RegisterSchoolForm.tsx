"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RegisterSchoolForm() {
  const router = useRouter();
  const [namaSekolah, setNamaSekolah] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register-sekolah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaSekolah, username, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        redirect?: string;
      };

      if (!response.ok || !data.redirect) {
        setError(data.error ?? "Pendaftaran gagal. Coba lagi.");
        return;
      }

      router.replace(data.redirect);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="nama-sekolah"
          className="mb-1.5 block text-sm font-semibold text-gelap"
        >
          Nama sekolah
        </label>
        <input
          id="nama-sekolah"
          name="namaSekolah"
          type="text"
          autoComplete="organization"
          required
          maxLength={160}
          value={namaSekolah}
          onChange={(event) => setNamaSekolah(event.target.value)}
          placeholder="contoh: SD Negeri 1 Sukamaju"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-gelap outline-none transition placeholder:text-stone-400 focus:border-merah focus:ring-4 focus:ring-merah/10"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">
          Gunakan nama resmi sekolah. Nama yang sama tidak dapat didaftarkan dua
          kali.
        </p>
      </div>

      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-semibold text-gelap"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={50}
          pattern="[a-z0-9][a-z0-9._-]{2,49}"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="contoh: sdn1-sukamaju"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-gelap outline-none transition placeholder:text-stone-400 focus:border-merah focus:ring-4 focus:ring-merah/10"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">
          3-50 karakter: huruf kecil, angka, titik, atau strip. Tidak bisa
          diubah setelah daftar.
        </p>
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-semibold text-gelap"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimal 8 karakter"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-gelap outline-none transition placeholder:text-stone-400 focus:border-merah focus:ring-4 focus:ring-merah/10"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1.5 block text-sm font-semibold text-gelap"
        >
          Ulangi password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Ketik ulang password"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-gelap outline-none transition placeholder:text-stone-400 focus:border-merah focus:ring-4 focus:ring-merah/10"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-merah px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-merah/20 transition hover:bg-merah-gelap focus:outline-none focus:ring-4 focus:ring-merah/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Mendaftarkan..." : "Daftar & masuk"}
      </button>
    </form>
  );
}
