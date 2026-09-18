import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const clerkAuth = clerkMiddleware(); // mount globally in server.ts

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });
  (req as any).auth = { userId };
  next();
}

export async function requireGroupMember(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).auth.userId;
  const groupId = req.params.groupId || req.body.groupId;
  const member = await prisma.member.findFirst({ where: { groupId, userId } });
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!member && group?.organiserId !== userId) {
    return res.status(403).json({ error: "Not a member of this group" });
  }
  next();
}