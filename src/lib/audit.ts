import { prisma } from "./prisma";

export async function logAudit(userId: string | null, action: string, details?: string) {
  await prisma.auditLog.create({
    data: { userId, action, details },
  });
}
