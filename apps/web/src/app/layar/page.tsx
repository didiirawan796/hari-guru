import type { Metadata } from "next";
import { LiveBoard } from "@/components/LiveBoard";
import { getLiveState } from "@/lib/undian";

export const metadata: Metadata = {
  title: "Layar Panggung",
};

export const dynamic = "force-dynamic";

export default async function LayarPage() {
  const state = await getLiveState();
  return <LiveBoard initial={state} variant="layar" />;
}
