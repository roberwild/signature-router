import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import {
  userTable,
  membershipTable,
  organizationTable,
  serviceRequestTable,
  serviceInfoClickTable,
  leadQualificationTable
} from '@workspace/database/schema';
import {
  leads,
  questionnaireSessions,
  responseEdits
} from '@workspace/database';
import { eq, sql, desc } from 'drizzle-orm';
import { UserDetailWrapper } from './user-detail-wrapper';

export const metadata: Metadata = {
  title: 'User Details | Admin Panel',
  description: 'View and manage user',
};

interface AdminUserDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

async function getUserDetails(id: string) {
  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      emailVerified: userTable.emailVerified,
      isPlatformAdmin: userTable.isPlatformAdmin,
      createdAt: userTable.createdAt,
      updatedAt: userTable.updatedAt,
      organizationCount: sql<number>`(
        SELECT COUNT(DISTINCT ${membershipTable.organizationId})::int
        FROM ${membershipTable}
        WHERE ${membershipTable.userId} = ${userTable.id}
      )`,
      serviceRequestCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${serviceRequestTable} 
        WHERE ${serviceRequestTable.userId} = ${userTable.id}
      )`,
    })
    .from(userTable)
    .where(eq(userTable.id, id))
    .limit(1);

  return user;
}

async function getUserOrganizations(userId: string) {
  const organizations = await db
    .select({
      id: organizationTable.id,
      organizationId: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
      role: membershipTable.role,
      joinedAt: membershipTable.createdAt,
    })
    .from(membershipTable)
    .innerJoin(organizationTable, eq(membershipTable.organizationId, organizationTable.id))
    .where(eq(membershipTable.userId, userId))
    .limit(10);

  return organizations;
}

async function getUserRecentActivity(userId: string) {
  const recentRequests = await db
    .select({
      id: serviceRequestTable.id,
      serviceName: serviceRequestTable.serviceName,
      status: serviceRequestTable.status,
      createdAt: serviceRequestTable.createdAt,
    })
    .from(serviceRequestTable)
    .where(eq(serviceRequestTable.userId, userId))
    .orderBy(desc(serviceRequestTable.createdAt))
    .limit(5);

  return recentRequests;
}

async function getUserLeadQualificationData(userId: string) {
  // Get lead qualification data for the user (across all organizations)
  const leadQualifications = await db
    .select({
      id: leadQualificationTable.id,
      organizationId: leadQualificationTable.organizationId,
      organizationName: organizationTable.name,
      userId: leadQualificationTable.userId,
      mainConcern: leadQualificationTable.mainConcern,
      complianceRequirements: leadQualificationTable.complianceRequirements,
      complianceOther: leadQualificationTable.complianceOther,
      itTeamSize: leadQualificationTable.itTeamSize,
      companySize: leadQualificationTable.companySize,
      recentIncidents: leadQualificationTable.recentIncidents,
      optionalResponses: leadQualificationTable.optionalResponses,
      specificNeeds: leadQualificationTable.specificNeeds,
      leadScore: leadQualificationTable.leadScore,
      leadClassification: leadQualificationTable.leadClassification,
      scoreComponents: leadQualificationTable.scoreComponents,
      completionTime: leadQualificationTable.completionTime,
      questionsAnswered: leadQualificationTable.questionsAnswered,
      optionalAnswered: leadQualificationTable.optionalAnswered,
      deviceType: leadQualificationTable.deviceType,
      abandonmentPoint: leadQualificationTable.abandonmentPoint,
      timePerQuestion: leadQualificationTable.timePerQuestion,
      createdAt: leadQualificationTable.createdAt,
      updatedAt: leadQualificationTable.updatedAt,
    })
    .from(leadQualificationTable)
    .leftJoin(organizationTable, eq(leadQualificationTable.organizationId, organizationTable.id))
    .where(eq(leadQualificationTable.userId, userId))
    .orderBy(desc(leadQualificationTable.createdAt));
  
  return leadQualifications.map(qualification => ({
    ...qualification,
    leadClassification: qualification.leadClassification as 'A1' | 'B1' | 'C1' | 'D1' | null,
    scoreComponents: qualification.scoreComponents as {
      urgency: number;
      budget: number;
      fit: number;
      engagement: number;
      decision: number;
    } | null
  }));
}

async function getUserLeadData(userId: string, email: string) {
  // Try to find lead by userId first, then by email
  const [leadData] = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, userId))
    .limit(1);
  
  if (leadData) {
    return leadData;
  }
  
  // If no lead by userId, try by email
  const [leadByEmail] = await db
    .select()
    .from(leads)
    .where(eq(leads.email, email))
    .limit(1);
  
  return leadByEmail;
}

async function getQuestionnaireSessions(leadId: string) {
  const sessions = await db
    .select()
    .from(questionnaireSessions)
    .where(eq(questionnaireSessions.leadId, leadId))
    .orderBy(desc(questionnaireSessions.startedAt))
    .limit(10);
  
  return sessions;
}

async function getResponseEdits(leadId: string) {
  const edits = await db
    .select()
    .from(responseEdits)
    .where(eq(responseEdits.leadId, leadId))
    .orderBy(desc(responseEdits.editedAt))
    .limit(10);
  
  return edits;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const session = await auth();
  const { id, locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  await requirePlatformAdmin();
  
  const user = await getUserDetails(id);
  
  if (!user) {
    notFound();
  }
  
  const organizations = await getUserOrganizations(id);
  const recentActivity = await getUserRecentActivity(id);
  
  // Get lead qualification data from leadQualificationTable
  const leadQualifications = await getUserLeadQualificationData(id);
  
  // Also check for lead data in the new leads table structure (if exists)
  const leadData = user.email ? await getUserLeadData(id, user.email) : null;
  const questionnaireSessions = leadData ? await getQuestionnaireSessions(leadData.id) : [];
  const responseEdits = leadData ? await getResponseEdits(leadData.id) : [];
  
  // Get service clicks for each organization
  const orgServiceClicks = await Promise.all(
    organizations.map(async (org) => {
      const clicks = await db
        .select({
          serviceName: serviceInfoClickTable.serviceName,
          serviceType: serviceInfoClickTable.serviceType,
          clickCount: sql<number>`count(*)::int`,
          lastClick: sql<Date>`max(${serviceInfoClickTable.clickedAt})`,
        })
        .from(serviceInfoClickTable)
        .where(eq(serviceInfoClickTable.organizationId, org.organizationId))
        .groupBy(serviceInfoClickTable.serviceName, serviceInfoClickTable.serviceType)
        .orderBy(desc(sql`count(*)`))
        .limit(3);
      
      const [stats] = await db
        .select({
          totalClicks: sql<number>`count(*)::int`,
          uniqueServices: sql<number>`count(distinct ${serviceInfoClickTable.serviceName})::int`,
        })
        .from(serviceInfoClickTable)
        .where(eq(serviceInfoClickTable.organizationId, org.organizationId));
      
      return {
        organizationId: org.organizationId,
        clicks,
        stats: stats || { totalClicks: 0, uniqueServices: 0 }
      };
    })
  );

  return (
    <UserDetailWrapper
      locale={locale}
      user={user}
      organizations={organizations}
      recentActivity={recentActivity}
      leadQualifications={leadQualifications}
      leadData={leadData}
      questionnaireSessions={questionnaireSessions}
      responseEdits={responseEdits}
      orgServiceClicks={orgServiceClicks}
      userId={id}
    />
  );
}