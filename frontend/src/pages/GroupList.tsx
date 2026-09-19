import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function GroupList() {
  const { getToken } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => apiFetch("/api/groups", {}, (await getToken()) ?? undefined),
  });

  const createGroup = useMutation({
    mutationFn: async (payload: any) =>
      apiFetch("/api/groups", { method: "POST", body: JSON.stringify(payload) }, (await getToken()) ?? undefined),
    onSuccess: (group) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      nav(`/groups/${group.id}`);
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Your Kolo groups</h1>
      <ul className="space-y-2 mb-6">
        {groups?.map((g: any) => (
          <li key={g.id} className="border p-3 rounded cursor-pointer" onClick={() => nav(`/groups/${g.id}`)}>
            {g.name} — {g.status}
          </li>
        ))}
      </ul>
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={() =>
          createGroup.mutate({
            name: "New Circle",
            amountKobo: "5000000",
            frequency: "monthly",
            startDate: new Date().toISOString(),
            feePolicy: "none",
            feeValue: 0,
            defaultPolicy: "net",
          })
        }
      >
        + New group (quick test)
      </button>
    </div>
  );
}
