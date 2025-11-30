import { db } from '@workspace/database';
import { serviceInfoClickTable, organizationTable, userTable } from '@workspace/database/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getServiceInfoClickStats() {
  // Get total clicks and unique users
  const [stats] = await db
    .select({
      totalClicks: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${serviceInfoClickTable.userId})::int`,
      last24Hours: sql<number>`count(case when ${serviceInfoClickTable.clickedAt} >= now() - interval '24 hours' then 1 end)::int`,
      last7Days: sql<number>`count(case when ${serviceInfoClickTable.clickedAt} >= now() - interval '7 days' then 1 end)::int`,
    })
    .from(serviceInfoClickTable);

  // Get clicks by service
  const clicksByService = await db
    .select({
      serviceName: serviceInfoClickTable.serviceName,
      serviceType: serviceInfoClickTable.serviceType,
      clickCount: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${serviceInfoClickTable.userId})::int`,
    })
    .from(serviceInfoClickTable)
    .groupBy(serviceInfoClickTable.serviceName, serviceInfoClickTable.serviceType)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Get recent clicks with user and org info
  const recentClicks = await db
    .select({
      id: serviceInfoClickTable.id,
      serviceName: serviceInfoClickTable.serviceName,
      serviceType: serviceInfoClickTable.serviceType,
      clickedAt: serviceInfoClickTable.clickedAt,
      userName: userTable.name,
      userEmail: userTable.email,
      organizationName: organizationTable.name,
    })
    .from(serviceInfoClickTable)
    .leftJoin(userTable, eq(serviceInfoClickTable.userId, userTable.id))
    .leftJoin(organizationTable, eq(serviceInfoClickTable.organizationId, organizationTable.id))
    .orderBy(desc(serviceInfoClickTable.clickedAt))
    .limit(20);

  return {
    stats: stats || { totalClicks: 0, uniqueUsers: 0, last24Hours: 0, last7Days: 0 },
    clicksByService,
    recentClicks
  };
}