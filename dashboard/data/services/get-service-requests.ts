import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getUserServiceRequests(userId: string, organizationId: string) {
  const requests = await db
    .select()
    .from(serviceRequestTable)
    .where(
      and(
        eq(serviceRequestTable.userId, userId),
        eq(serviceRequestTable.organizationId, organizationId)
      )
    )
    .orderBy(desc(serviceRequestTable.createdAt));

  return requests;
}

export async function getServiceRequestById(id: string, userId: string) {
  const [request] = await db
    .select()
    .from(serviceRequestTable)
    .where(
      and(
        eq(serviceRequestTable.id, id),
        eq(serviceRequestTable.userId, userId)
      )
    )
    .limit(1);

  return request;
}