"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface LoginFormProps {
  mode: "sekolah" | "admin";
  next?: string;
}

function safeNext(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function LoginForm({ mode, next }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSchool = mode === "sekolah";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        isSchool ? "/api/auth/login-sekolah" : "/api/auth/login-admin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        redirect?: string;
      };

      if (!response.ok || !data.redirect) {
        setError(data.error ?? "Login gagal. Coba lagi.");
        return;
      }

      router.replace(safeNext(next, data.redirect));
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
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={isSchool ? "contoh: sdn-01" : "contoh: admin"}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-gelap outline-none transition placeholder:text-stone-400 focus:border-merah focus:ring-4 focus:ring-merah/10"
        />
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan password"
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
        {loading ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
