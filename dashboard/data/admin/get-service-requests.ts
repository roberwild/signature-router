import { db } from '@workspace/database';
import { serviceRequestTable, organizationTable, userTable } from '@workspace/database/schema';
import { eq, desc } from 'drizzle-orm';

export async function getAllServiceRequests() {
  try {
    const requests = await db
      .select({
        id: serviceRequestTable.id,
        serviceType: serviceRequestTable.serviceType,
        serviceName: serviceRequestTable.serviceName,
        status: serviceRequestTable.status,
        message: serviceRequestTable.message,
        adminNotes: serviceRequestTable.adminNotes,
        contactName: serviceRequestTable.contactName,
        contactEmail: serviceRequestTable.contactEmail,
        contactPhone: serviceRequestTable.contactPhone,
        createdAt: serviceRequestTable.createdAt,
        updatedAt: serviceRequestTable.updatedAt,
        organizationName: organizationTable.name,
        organizationId: organizationTable.id,
        userName: userTable.name,
        userEmail: userTable.email,
      })
      .from(serviceRequestTable)
      .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
      .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
      .orderBy(desc(serviceRequestTable.createdAt));

    return requests;
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return [];
  }
}