import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api";
import { ObligationGrid } from "../components/ObligationGrid";
import { PaymentRecorder } from "../components/PaymentRecorder";

export default function GroupDetail() {
  const { groupId } = useParams();
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [activeCell, setActiveCell] = useState<any>(null);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => apiFetch(`/api/groups/${groupId}`, {}, (await getToken()) ?? undefined),
  });

  if (!group) return <p className="p-6">Loading…</p>;

  const positions = group.positions.map((p: any) => ({
    ordinal: p.ordinal,
    holderName: group.members.find((m: any) => m.id === p.currentHolderId)?.name ?? "?",
  }));
  const cycles = group.cycles.map((c: any) => ({ ordinal: c.ordinal, dueDate: c.dueDate }));
  const cells = group.cycles.flatMap((c: any) =>
    c.obligations.map((o: any) => ({
      positionOrdinal: group.positions.find((p: any) => p.id === o.positionId)?.ordinal,
      cycleOrdinal: c.ordinal,
      status: o.status,
      balanceKobo: Number(o.balanceKobo),
      obligationId: o.id,
    }))
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">{group.name}</h1>
      <ObligationGrid positions={positions} cycles={cycles} cells={cells} onCellClick={setActiveCell} />

      {activeCell && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={() => setActiveCell(null)}>
          <div className="bg-white rounded" onClick={(e) => e.stopPropagation()}>
            <PaymentRecorder
              obligationId={activeCell.obligationId}
              memberId={group.members[0]?.id}
              outstandingKobo={activeCell.balanceKobo}
              onDone={() => { setActiveCell(null); qc.invalidateQueries({ queryKey: ["group", groupId] }); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}