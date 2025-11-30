import { db, eq, desc, sql } from '@workspace/database';
import { serviceInfoClickTable, organizationTable, userTable, leadQualificationTable } from '@workspace/database';

export async function getServiceInfoClicksByOrganization(serviceName?: string) {
  // First get the basic organization stats with contact info and lead scoring
  const query = db
    .select({
      organizationId: serviceInfoClickTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
      organizationPhone: organizationTable.phone,
      clickCount: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${serviceInfoClickTable.userId})::int`,
      lastClickedAt: sql<Date>`max(${serviceInfoClickTable.clickedAt})`,
      services: sql<string[]>`array_agg(distinct ${serviceInfoClickTable.serviceName})`,
      // Get the most recent user who clicked
      lastUserName: sql<string>`(
        SELECT u.name 
        FROM ${userTable} u 
        JOIN ${serviceInfoClickTable} s ON s.user_id = u.id 
        WHERE s.organization_id = ${serviceInfoClickTable.organizationId}
        ORDER BY s.clicked_at DESC 
        LIMIT 1
      )`,
      lastUserEmail: sql<string>`(
        SELECT u.email 
        FROM ${userTable} u 
        JOIN ${serviceInfoClickTable} s ON s.user_id = u.id 
        WHERE s.organization_id = ${serviceInfoClickTable.organizationId}
        ORDER BY s.clicked_at DESC 
        LIMIT 1
      )`,
      // Get lead scoring data if available (from organization users)
      leadScore: sql<number | null>`(
        SELECT MAX(lq."leadScore")
        FROM ${leadQualificationTable} lq
        JOIN ${userTable} u ON u.id = lq."userId"
        JOIN ${serviceInfoClickTable} sic ON sic.user_id = u.id
        WHERE sic.organization_id = ${serviceInfoClickTable.organizationId}
      )`,
      leadCategory: sql<string | null>`(
        SELECT lq."leadClassification"
        FROM ${leadQualificationTable} lq
        JOIN ${userTable} u ON u.id = lq."userId"
        JOIN ${serviceInfoClickTable} sic ON sic.user_id = u.id
        WHERE sic.organization_id = ${serviceInfoClickTable.organizationId}
        ORDER BY lq."leadScore" DESC
        LIMIT 1
      )`,
    })
    .from(serviceInfoClickTable)
    .leftJoin(organizationTable, eq(serviceInfoClickTable.organizationId, organizationTable.id))
    .groupBy(serviceInfoClickTable.organizationId, organizationTable.name, organizationTable.slug, organizationTable.phone);

  if (serviceName) {
    query.where(eq(serviceInfoClickTable.serviceName, serviceName));
  }

  const results = await query.orderBy(desc(sql`count(*)`));

  // For each organization, get detailed service clicks
  const resultsWithServiceDetails = await Promise.all(
    results.map(async (org) => {
      const serviceDetails = await db
        .select({
          serviceName: serviceInfoClickTable.serviceName,
          serviceType: serviceInfoClickTable.serviceType,
          clickCount: sql<number>`count(*)::int`,
          lastClick: sql<Date>`max(${serviceInfoClickTable.clickedAt})`,
        })
        .from(serviceInfoClickTable)
        .where(eq(serviceInfoClickTable.organizationId, org.organizationId))
        .groupBy(serviceInfoClickTable.serviceName, serviceInfoClickTable.serviceType)
        .orderBy(desc(sql`count(*)`));

      return {
        ...org,
        serviceDetails,
      };
    })
  );

  return resultsWithServiceDetails;
}

export async function getOrganizationServiceClicks(organizationId: string) {
  // Get all service clicks for a specific organization
  const clicks = await db
    .select({
      id: serviceInfoClickTable.id,
      serviceName: serviceInfoClickTable.serviceName,
      serviceType: serviceInfoClickTable.serviceType,
      clickedAt: serviceInfoClickTable.clickedAt,
      userName: userTable.name,
      userEmail: userTable.email,
    })
    .from(serviceInfoClickTable)
    .leftJoin(userTable, eq(serviceInfoClickTable.userId, userTable.id))
    .where(eq(serviceInfoClickTable.organizationId, organizationId))
    .orderBy(desc(serviceInfoClickTable.clickedAt));

  // Get aggregated stats by service
  const statsByService = await db
    .select({
      serviceName: serviceInfoClickTable.serviceName,
      serviceType: serviceInfoClickTable.serviceType,
      clickCount: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${serviceInfoClickTable.userId})::int`,
      firstClick: sql<Date>`min(${serviceInfoClickTable.clickedAt})`,
      lastClick: sql<Date>`max(${serviceInfoClickTable.clickedAt})`,
    })
    .from(serviceInfoClickTable)
    .where(eq(serviceInfoClickTable.organizationId, organizationId))
    .groupBy(serviceInfoClickTable.serviceName, serviceInfoClickTable.serviceType)
    .orderBy(desc(sql`count(*)`));

  // Get overall stats
  const [overallStats] = await db
    .select({
      totalClicks: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${serviceInfoClickTable.userId})::int`,
      uniqueServices: sql<number>`count(distinct ${serviceInfoClickTable.serviceName})::int`,
      firstInteraction: sql<Date>`min(${serviceInfoClickTable.clickedAt})`,
      lastInteraction: sql<Date>`max(${serviceInfoClickTable.clickedAt})`,
    })
    .from(serviceInfoClickTable)
    .where(eq(serviceInfoClickTable.organizationId, organizationId));

  return {
    clicks,
    statsByService,
    overallStats: overallStats || {
      totalClicks: 0,
      uniqueUsers: 0,
      uniqueServices: 0,
      firstInteraction: null,
      lastInteraction: null,
    },
  };
}