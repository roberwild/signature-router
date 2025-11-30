import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@workspace/database';
import { 
  serviceRequestTable,
  leadQualificationTable,
  organizationTable,
  userTable 
} from '@workspace/database/schema';

export type ServiceRequestWithLead = {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  serviceType: string | null;
  serviceName: string | null;
  status: string;
  message: string | null;
  adminNotes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Lead information
  leadScore: number | null;
  leadClassification: string | null;
  mainConcern: string | null;
  companySize: string | null;
  recentIncidents: string | null;
};

export async function getServiceRequestsWithLeads(): Promise<ServiceRequestWithLead[]> {
  const requests = await db
    .select({
      id: serviceRequestTable.id,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      userId: serviceRequestTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
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
      
      // Lead fields
      leadScore: leadQualificationTable.leadScore,
      leadClassification: leadQualificationTable.leadClassification,
      mainConcern: leadQualificationTable.mainConcern,
      companySize: leadQualificationTable.companySize,
      recentIncidents: leadQualificationTable.recentIncidents,
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
    .leftJoin(leadQualificationTable, 
      eq(serviceRequestTable.userId, leadQualificationTable.userId)
    )
    .orderBy(desc(serviceRequestTable.createdAt));

  return requests as ServiceRequestWithLead[];
}

export async function getServiceRequestWithLead(requestId: string): Promise<ServiceRequestWithLead | null> {
  const requests = await db
    .select({
      id: serviceRequestTable.id,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      userId: serviceRequestTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
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
      
      // Lead fields
      leadScore: leadQualificationTable.leadScore,
      leadClassification: leadQualificationTable.leadClassification,
      mainConcern: leadQualificationTable.mainConcern,
      companySize: leadQualificationTable.companySize,
      recentIncidents: leadQualificationTable.recentIncidents,
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
    .leftJoin(leadQualificationTable, 
      eq(serviceRequestTable.userId, leadQualificationTable.userId)
    )
    .where(eq(serviceRequestTable.id, requestId))
    .limit(1);

  return requests[0] as ServiceRequestWithLead || null;
}

export async function getLeadConversionMetrics() {
  const result = await db
    .select({
      totalLeads: sql<number>`COUNT(DISTINCT ${leadQualificationTable.id})`,
      leadsWithRequests: sql<number>`COUNT(DISTINCT CASE WHEN ${serviceRequestTable.id} IS NOT NULL THEN ${leadQualificationTable.id} END)`,
      a1Conversions: sql<number>`COUNT(DISTINCT CASE WHEN ${leadQualificationTable.leadClassification} = 'A1' AND ${serviceRequestTable.id} IS NOT NULL THEN ${leadQualificationTable.id} END)`,
      b1Conversions: sql<number>`COUNT(DISTINCT CASE WHEN ${leadQualificationTable.leadClassification} = 'B1' AND ${serviceRequestTable.id} IS NOT NULL THEN ${leadQualificationTable.id} END)`,
    })
    .from(leadQualificationTable)
    .leftJoin(serviceRequestTable, eq(leadQualificationTable.userId, serviceRequestTable.userId));

  const metrics = result[0];
  
  return {
    totalLeads: Number(metrics.totalLeads) || 0,
    leadsWithRequests: Number(metrics.leadsWithRequests) || 0,
    conversionRate: metrics.totalLeads > 0 
      ? (Number(metrics.leadsWithRequests) / Number(metrics.totalLeads)) * 100 
      : 0,
    a1ConversionRate: metrics.a1Conversions > 0 
      ? (Number(metrics.a1Conversions) / Number(metrics.totalLeads)) * 100 
      : 0,
    b1ConversionRate: metrics.b1Conversions > 0 
      ? (Number(metrics.b1Conversions) / Number(metrics.totalLeads)) * 100 
      : 0,
  };
}