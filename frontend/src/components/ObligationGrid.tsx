interface Cell {
  positionOrdinal: number;
  cycleOrdinal: number;
  status: "unpaid" | "partial" | "paid" | "pending";
  balanceKobo: number;
  obligationId: string;
}

export function ObligationGrid({
  positions,
  cycles,
  cells,
  onCellClick,
}: {
  positions: { ordinal: number; holderName: string }[];
  cycles: { ordinal: number; dueDate: string }[];
  cells: Cell[];
  onCellClick: (c: Cell) => void;
}) {
  const cellFor = (p: number, c: number) => cells.find((x) => x.positionOrdinal === p && x.cycleOrdinal === c);

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 border p-2">Position</th>
            {cycles.map((c) => (
              <th key={c.ordinal} className="border p-2 text-xs">Cycle {c.ordinal}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.ordinal}>
              <td className="sticky left-0 bg-white z-10 border p-2 font-medium">#{p.ordinal} — {p.holderName}</td>
              {cycles.map((c) => {
                const cell = cellFor(p.ordinal, c.ordinal);
                return (
                  <td
                    key={c.ordinal}
                    onClick={() => cell && onCellClick(cell)}
                    className={`border p-2 text-xs cursor-pointer ${statusClass(cell?.status)}`}
                  >
                    {statusLabel(cell?.status)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusLabel(s?: string) {
  return ({ unpaid: "Unpaid", partial: "Partial", paid: "Paid ✓", pending: "Pending…" } as any)[s ?? ""] ?? "—";
}
function statusClass(s?: string) {
  return ({ unpaid: "bg-red-50", partial: "bg-yellow-50", paid: "bg-green-50", pending: "bg-gray-100" } as any)[s ?? ""] ?? "";
}