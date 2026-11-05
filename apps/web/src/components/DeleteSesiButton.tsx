"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteSesiButtonProps {
  id: string;
  disabled: boolean;
}

export function DeleteSesiButton({ id, disabled }: DeleteSesiButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        "Hapus sesi hadiah ini? Tindakan ini tidak dapat dibatalkan.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sesi/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        window.alert(data.error ?? "Gagal menghapus sesi.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={disabled || loading}
      title={
        disabled
          ? "Sesi berjalan atau sudah memiliki pemenang tidak dapat dihapus."
          : "Hapus sesi"
      }
      className="rounded-md px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
    >
      {loading ? "..." : "Hapus"}
    </button>
  );
}
