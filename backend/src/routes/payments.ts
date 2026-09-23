import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { logAudit } from "../lib/audit";

export const paymentsRouter = Router();

paymentsRouter.post("/:obligationId/payments", requireAuth, async (req, res) => {
  const { obligationId } = req.params;
  const { amountKobo, paidAt, method, reference, proofUrl, memberId } = req.body;

  const payment = await prisma.payment.create({
    data: {
      obligationId,
      memberId,
      amountKobo: BigInt(amountKobo),
      paidAt: new Date(paidAt),
      method,
      reference,
      proofUrl,
      status: "pending",
      recordedBy: (req as any).auth.userId,
    },
  });
  res.status(201).json({ ...payment, amountKobo: payment.amountKobo.toString() });
});

paymentsRouter.post("/payments/:id/confirm", requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: req.params.id, status: "pending" },
        data: { status: "confirmed", confirmedBy: userId },
      });

      const obligation = await tx.obligation.findUniqueOrThrow({ where: { id: payment.obligationId } });
      const newPaid = obligation.paidKobo + payment.amountKobo;
      const newBalance = obligation.dueKobo - newPaid;

      await tx.obligation.update({
        where: { id: obligation.id },
        data: { paidKobo: newPaid, balanceKobo: newBalance, status: newBalance <= 0n ? "paid" : "partial" },
      });

      await logAudit(tx, { groupId: req.body.groupId, actor: userId, action: "payment.confirm", entity: "payment", after: payment });
      return payment;
    });
    res.json({ ...result, amountKobo: result.amountKobo.toString() });
  } catch {
    res.status(409).json({ error: "Payment already confirmed or not found" });
  }
});

paymentsRouter.post("/payments/:id/reject", requireAuth, async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id, status: "pending" },
      data: { status: "rejected" },
    });
    res.json(payment);
  } catch {
    res.status(409).json({ error: "Not pending or not found" });
  }
});

paymentsRouter.post("/payments/:id/reverse", requireAuth, async (req, res) => {
  const { reason, groupId } = req.body;
  const userId = (req as any).auth.userId;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const original = await tx.payment.findUniqueOrThrow({ where: { id: req.params.id } });
      if (original.status !== "confirmed") throw new Error("Only confirmed payments can be reversed");

      const reversal = await tx.payment.create({
        data: {
          obligationId: original.obligationId,
          memberId: original.memberId,
          amountKobo: -original.amountKobo,
          paidAt: new Date(),
          method: "reversal",
          reference: reason,
          status: "confirmed",
          recordedBy: userId,
          confirmedBy: userId,
          reversesId: original.id,
        },
      });

      const obligation = await tx.obligation.findUniqueOrThrow({ where: { id: original.obligationId } });
      const newPaid = obligation.paidKobo - original.amountKobo;
      await tx.obligation.update({
        where: { id: obligation.id },
        data: { paidKobo: newPaid, balanceKobo: obligation.dueKobo - newPaid, status: newPaid <= 0n ? "unpaid" : "partial" },
      });

      await logAudit(tx, { groupId, actor: userId, action: "payment.reverse", entity: "payment", before: original, after: reversal });
      return reversal;
    });
    res.json({ ...result, amountKobo: result.amountKobo.toString() });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});