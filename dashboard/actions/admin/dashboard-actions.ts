'use server';

import { db } from '@workspace/database';
import { 
  organizationTable, 
  userTable, 
  serviceRequestTable, 
  contactMessageTable,
  membershipTable,
  ServiceRequestStatus
} from '@workspace/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requirePlatformAdmin } from '~/middleware/admin';

export async function getDashboardMetrics() {
  await requirePlatformAdmin();
  
  const [
    organizationsResult,
    usersResult,
    pendingRequestsResult,
    totalRequestsResult,
    unreadMessagesResult
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(organizationTable),
    db.select({ count: sql<number>`count(*)` }).from(userTable),
    db.select({ count: sql<number>`count(*)` })
      .from(serviceRequestTable)
      .where(eq(serviceRequestTable.status, ServiceRequestStatus.PENDING)),
    db.select({ count: sql<number>`count(*)` }).from(serviceRequestTable),
    db.select({ count: sql<number>`count(*)` })
      .from(contactMessageTable)
      .where(eq(contactMessageTable.status, 'unread'))
  ]);

  return {
    totalOrganizations: Number(organizationsResult[0]?.count) || 0,
    totalUsers: Number(usersResult[0]?.count) || 0,
    unreadMessages: Number(unreadMessagesResult[0]?.count) || 0,
    pendingServiceRequests: Number(pendingRequestsResult[0]?.count) || 0,
    totalServiceRequests: Number(totalRequestsResult[0]?.count) || 0
  };
}

export async function getRecentLeads(limit = 5) {
  await requirePlatformAdmin();
  
  // First get the unique recent users
  const recentUsers = await db
    .selectDistinct({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt))
    .limit(limit);
  
  // Then fetch their organization info separately if needed
  const usersWithOrgs = await Promise.all(
    recentUsers.map(async (user) => {
      const membership = await db
        .select({
          organizationName: organizationTable.name,
          organizationId: organizationTable.id
        })
        .from(membershipTable)
        .leftJoin(organizationTable, eq(membershipTable.organizationId, organizationTable.id))
        .where(eq(membershipTable.userId, user.id))
        .limit(1);
      
      return {
        ...user,
        organizationName: membership[0]?.organizationName || null,
        organizationId: membership[0]?.organizationId || null
      };
    })
  );
    
  return usersWithOrgs;
}

export async function getRecentServiceRequests(limit = 5) {
  await requirePlatformAdmin();
  
  const recentRequests = await db
    .select({
      id: serviceRequestTable.id,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      serviceType: serviceRequestTable.serviceType,
      status: serviceRequestTable.status,
      createdAt: serviceRequestTable.createdAt,
      contactName: serviceRequestTable.contactName,
      contactEmail: serviceRequestTable.contactEmail
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .where(eq(serviceRequestTable.status, ServiceRequestStatus.PENDING))
    .orderBy(desc(serviceRequestTable.createdAt))
    .limit(limit);
    
  return recentRequests;
}

export async function getUnreadMessages(limit = 5) {
  await requirePlatformAdmin();
  
  const unreadMessages = await db
    .select({
      id: contactMessageTable.id,
      organizationId: contactMessageTable.organizationId,
      organizationName: organizationTable.name,
      name: contactMessageTable.name,
      email: contactMessageTable.email,
      subject: contactMessageTable.subject,
      message: contactMessageTable.message,
      createdAt: contactMessageTable.createdAt,
      status: contactMessageTable.status
    })
    .from(contactMessageTable)
    .leftJoin(organizationTable, eq(contactMessageTable.organizationId, organizationTable.id))
    .where(eq(contactMessageTable.status, 'unread'))
    .orderBy(desc(contactMessageTable.createdAt))
    .limit(limit);
    
  return unreadMessages;
}

export async function markMessageAsRead(messageId: string) {
  await requirePlatformAdmin();
  
  await db
    .update(contactMessageTable)
    .set({ status: 'read', updatedAt: new Date() })
    .where(eq(contactMessageTable.id, messageId));
    
  return { success: true };
}

export async function updateServiceRequestStatus(requestId: string, status: ServiceRequestStatus) {
  await requirePlatformAdmin();
  
  await db
    .update(serviceRequestTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(serviceRequestTable.id, requestId));
    
  return { success: true };
}