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