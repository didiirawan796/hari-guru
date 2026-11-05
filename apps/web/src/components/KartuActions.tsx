"use client";

import { useState } from "react";

interface KartuActionsProps {
  nomorUndian: string;
}

export function KartuActions({ nomorUndian }: KartuActionsProps) {
  const [copied, setCopied] = useState(false);

  async function salinTautan() {
    const url = `${window.location.origin}/kartu/${nomorUndian}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Salin tautan kartu berikut:", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-merah px-4 py-2.5 text-sm font-bold text-white transition hover:bg-merah-gelap focus:outline-none focus:ring-4 focus:ring-merah/20"
      >
        Cetak / Simpan PDF
      </button>
      <button
        type="button"
        onClick={salinTautan}
        className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-merah hover:text-merah focus:outline-none focus:ring-4 focus:ring-merah/10"
      >
        {copied ? "Tautan tersalin" : "Salin tautan"}
      </button>
    </div>
  );
}
