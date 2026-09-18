export async function logAudit(
  tx: any,
  params: { groupId: string; actor: string; action: string; entity: string; before?: any; after?: any }
) {
  await tx.auditLog.create({ data: params });
}