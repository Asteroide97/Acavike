import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAuditEntry(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("audit-log-error", error);
  }
}
