"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateSesiForm() {
  const router = useRouter();
  const [namaHadiah, setNamaHadiah] = useState("");
  const [urutan, setUrutan] = useState("");
  const [jumlahPemenang, setJumlahPemenang] = useState("1");
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
      const response = await fetch("/api/admin/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaHadiah,
          urutan: Number(urutan),
          jumlahPemenang: Number(jumlahPemenang),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "Gagal menambah sesi hadiah.",
        });
        return;
      }

      setNamaHadiah("");
      setUrutan("");
      setJumlahPemenang("1");
      setMessage({
        type: "sukses",
        text: "Sesi hadiah berhasil ditambahkan.",
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
          htmlFor="nama-hadiah"
          className="mb-1 block text-xs font-semibold text-stone-600"
        >
          Nama hadiah
        </label>
        <input
          id="nama-hadiah"
          value={namaHadiah}
          onChange={(event) => setNamaHadiah(event.target.value)}
          required
          maxLength={120}
          placeholder="Sepeda listrik"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="urutan-sesi"
            className="mb-1 block text-xs font-semibold text-stone-600"
          >
            Urutan
          </label>
          <input
            id="urutan-sesi"
            type="number"
            min={1}
            value={urutan}
            onChange={(event) => setUrutan(event.target.value)}
            required
            placeholder="1"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
          />
        </div>
        <div>
          <label
            htmlFor="jumlah-pemenang"
            className="mb-1 block text-xs font-semibold text-stone-600"
          >
            Jumlah pemenang
          </label>
          <input
            id="jumlah-pemenang"
            type="number"
            min={1}
            max={100}
            value={jumlahPemenang}
            onChange={(event) => setJumlahPemenang(event.target.value)}
            required
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-merah focus:ring-2 focus:ring-merah/10"
          />
        </div>
      </div>

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
        className="w-full rounded-lg bg-gelap px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Tambah sesi hadiah"}
      </button>
    </form>
  );
}
