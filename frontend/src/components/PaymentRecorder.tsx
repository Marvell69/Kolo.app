import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api";

const schema = z.object({
  amountKobo: z.string(),
  paidAt: z.string(),
  method: z.string(),
  reference: z.string().optional(),
});

export function PaymentRecorder({ obligationId, memberId, outstandingKobo, onDone }: {
  obligationId: string; memberId: string; outstandingKobo: number; onDone: () => void;
}) {
  const { getToken } = useAuth();
  const { register, handleSubmit, watch } = useForm({ resolver: zodResolver(schema) });
  const amount = Number(watch("amountKobo") || 0);

  const onSubmit = async (data: any) => {
    await apiFetch(
      `/api/obligations/${obligationId}/payments`,
      { method: "POST", body: JSON.stringify({ ...data, memberId }) },
      (await getToken()) ?? undefined
    );
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 p-4">
      <input {...register("amountKobo")} placeholder="Amount (kobo)" className="border p-2 w-full" />
      {amount > outstandingKobo && <p className="text-yellow-600 text-sm">This exceeds the outstanding balance of {outstandingKobo}.</p>}
      <input {...register("paidAt")} type="date" className="border p-2 w-full" />
      <input {...register("method")} placeholder="Method (bank transfer, cash…)" className="border p-2 w-full" />
      <input {...register("reference")} placeholder="Reference (optional)" className="border p-2 w-full" />
      <button className="bg-black text-white px-4 py-2 rounded">Record payment</button>
    </form>
  );
}