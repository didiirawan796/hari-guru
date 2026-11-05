import type { Metadata } from "next";
import { LiveBoard } from "@/components/LiveBoard";
import { PublicHeader } from "@/components/PublicHeader";
import { getLiveState } from "@/lib/undian";

export const metadata: Metadata = {
  title: "Live Undian",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const state = await getLiveState();

  return (
    <main className="min-h-dvh bg-krem bg-pattern-lembut">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <LiveBoard initial={state} variant="live" />
      </div>
    </main>
  );
}
