import type { Metadata } from "next";
import { OperatorConsole } from "@/components/OperatorConsole";
import { PanelShell } from "@/components/PanelShell";
import { requireRole } from "@/lib/session";
import { getOperatorData } from "@/lib/undian";

export const metadata: Metadata = {
  title: "Operator Panitia",
};

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  const session = await requireRole(["operator"]);
  const data = await getOperatorData();

  return (
    <PanelShell
      area="Operator Panitia"
      nama={session.namaTampilan}
      roleLabel="Operator"
    >
      <OperatorConsole initialData={data} />
    </PanelShell>
  );
}
