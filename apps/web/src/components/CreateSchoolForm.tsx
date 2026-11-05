"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateSchoolForm() {
  const router = useRouter();
  const [namaSekolah, setNamaSekolah] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "sukses" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/sekolah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaSekolah, username, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Gagal membuat akun sekolah.",
        });
        return;
      }

      setNamaSekolah("");
      setUsername("");
      setPassword("");
      setMessage({
        type: "sukses",
        text: "Akun sekolah berhasil dibuat.",
      });
      router.refresh();
    } catch {
      setMessage({
        type: "error",
        text: "Tidak dapat menghubungi server.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="nama-sekolah"
          className="mb-1 block text-xs font-semibold text-stone-600"
        >
          Nama sekolah
        </label>
        <input
          id="nama-sekolah"
          value={namaSekolah}
          onChange={(event) => setNamaSekolah(event.target.value)}
          required
          maxLength={160}
          placeholder="SD Negeri 1 Kecamatan"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="username-sekolah"
            className="mb-1 block text-xs font-semibold text-stone-600"
          >
            Username
          </label>
          <input
            id="username-sekolah"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="off"
            placeholder="sdn-01"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
          />
        </div>
        <div>
          <label
            htmlFor="password-sekolah"
            className="mb-1 block text-xs font-semibold text-stone-600"
          >
            Password awal
          </label>
          <input
            id="password-sekolah"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-stone-400">
        Username: 3-50 karakter, huruf kecil, angka, titik, atau strip.
        Sampaikan password kepada perwakilan sekolah.
      </p>

      {message ? (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            message.type === "sukses"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-merah px-4 py-2.5 text-sm font-bold text-white transition hover:bg-merah-gelap disabled:opacity-60"
      >
        {loading ? "Membuat akun..." : "Buat akun sekolah"}
      </button>
    </form>
  );
}
