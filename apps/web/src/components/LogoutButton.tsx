"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-merah hover:text-merah disabled:opacity-60"
    >
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
