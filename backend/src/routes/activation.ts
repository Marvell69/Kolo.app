import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { generateSchedule, seededDraw } from "../domain/scheduleGenerator";
import { logAudit } from "../lib/audit";
import crypto from "crypto";

export const activationRouter = Router();

activationRouter.post("/:groupId/activate", requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId;

  const result = await prisma.$transaction(async (tx) => {
    const group = await tx.group.findUniqueOrThrow({
      where: { id: req.params.groupId, status: "draft" },
      include: { members: true },
    });

    const seed = crypto.randomUUID();
    const order = seededDraw(group.members.map((m) => m.id), seed);

    const positions = await Promise.all(
      order.map((memberId, i) =>
        tx.position.create({ data: { groupId: group.id, ordinal: i + 1, currentHolderId: memberId } })
      )
    );

    const { cycles, obligations } = generateSchedule({
      positions: positions.map((p) => ({ ordinal: p.ordinal, memberId: p.currentHolderId })),
      amountKobo: group.amountKobo,
      frequency: group.frequency as any,
      startDate: group.startDate,
    });

    const positionByOrdinal = new Map(positions.map((p) => [p.ordinal, p]));

    const insertedCycles = await Promise.all(
      cycles.map((c) =>
        tx.cycle.create({
          data: {
            groupId: group.id,
            ordinal: c.ordinal,
            dueDate: c.dueDate,
            receivingPositionId: positionByOrdinal.get(c.receivingPositionOrdinal)!.id,
            potExpectedKobo: group.amountKobo * BigInt(positions.length),
          },
        })
      )
    );
    const cycleByOrdinal = new Map(insertedCycles.map((c) => [c.ordinal, c]));

    await tx.obligation.createMany({
      data: obligations.map((o) => ({
        cycleId: cycleByOrdinal.get(o.cycleOrdinal)!.id,
        positionId: positionByOrdinal.get(o.positionOrdinal)!.id,
        dueKobo: o.dueKobo,
        balanceKobo: o.dueKobo,
      })),
    });

    const updated = await tx.group.update({
      where: { id: group.id },
      data: { status: "active", drawSeed: seed, drawAlgo: "fisher-yates-lcg" },
    });

    await logAudit(tx, { groupId: group.id, actor: userId, action: "group.activate", entity: "group", after: updated });
    return updated;
  }).catch(() => null);

  if (!result) return res.status(409).json({ error: "Group already active or not found" });
  res.json(result);
});