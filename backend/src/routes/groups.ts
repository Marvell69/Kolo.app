import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { logAudit } from "../lib/audit";

export const groupsRouter = Router();

const createGroupSchema = z.object({
  name: z.string().min(2),
  amountKobo: z.string(),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string(),
  feePolicy: z.enum(["first_pot", "percentage", "free_cycle", "none"]),
  feeValue: z.number().default(0),
  defaultPolicy: z.enum(["absorb", "float", "hold", "net"]),
});

groupsRouter.post("/", requireAuth, async (req, res) => {
  const body = createGroupSchema.parse(req.body);
  const userId = (req as any).auth.userId;
  const group = await prisma.$transaction(async (tx) => {
    const g = await tx.group.create({
      data: {
        ...body,
        amountKobo: BigInt(body.amountKobo),
        startDate: new Date(body.startDate),
        organiserId: userId,
        status: "draft",
      },
    });
    await logAudit(tx, { groupId: g.id, actor: userId, action: "group.create", entity: "group", after: g });
    return g;
  });
  res.status(201).json({ ...group, amountKobo: group.amountKobo.toString() });
});

groupsRouter.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId;
  const groups = await prisma.group.findMany({
    where: { OR: [{ organiserId: userId }, { members: { some: { userId } } }] },
  });
  res.json(groups.map((g) => ({ ...g, amountKobo: g.amountKobo.toString() })));
});

groupsRouter.get("/:id", requireAuth, async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: req.params.id },
    include: { members: true, positions: true, cycles: { include: { obligations: true } } },
  });
  if (!group) return res.status(404).json({ error: "Not found" });
  res.json(group);
});

groupsRouter.post("/:id/members", requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const member = await prisma.member.create({
    data: { groupId: req.params.id, name, phone, status: "active" },
  });
  res.status(201).json(member);
});
