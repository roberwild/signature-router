import 'server-only';

import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { platformConfigAuditTable, platformConfigTable, userTable } from '@workspace/database';
import { eq, desc, and, gte, lte, like, sql } from 'drizzle-orm';
import { isPlatformAdmin } from '~/middleware/admin';

interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  configKey?: string;
}

export async function getConfigAuditLogs(params: GetAuditLogsParams = {}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error('Forbidden - Admin access required');
  }

  const {
    page = 1,
    limit = 50,
    startDate,
    endDate,
    userId,
    configKey
  } = params;

  // Build filter conditions
  const conditions = [];

  if (startDate) {
    conditions.push(gte(platformConfigAuditTable.changed_at, startDate));
  }

  if (endDate) {
    conditions.push(lte(platformConfigAuditTable.changed_at, endDate));
  }

  if (userId) {
    conditions.push(eq(platformConfigAuditTable.changed_by, userId));
  }

  // Build count query with configKey filter if needed
  let countQuery;
  if (configKey) {
    const countConditions = [...conditions, like(platformConfigTable.key, `%${configKey}%`)];
    countQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformConfigAuditTable)
      .leftJoin(platformConfigTable, eq(platformConfigAuditTable.config_id, platformConfigTable.id))
      .where(countConditions.length > 0 ? and(...countConditions) : undefined);
  } else {
    countQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformConfigAuditTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }
  
  const total = countQuery[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // Build all where conditions including configKey filter
  const allConditions = [...conditions];
  if (configKey) {
    allConditions.push(like(platformConfigTable.key, `%${configKey}%`));
  }

  // Fetch audit logs with user info and config details
  const query = db
    .select({
      id: platformConfigAuditTable.id,
      action: platformConfigAuditTable.action,
      config_key: platformConfigTable.key,
      previous_value: platformConfigAuditTable.previous_value,
      new_value: platformConfigAuditTable.new_value,
      is_sensitive: platformConfigTable.is_sensitive,
      changed_at: platformConfigAuditTable.changed_at,
      changed_by: platformConfigAuditTable.changed_by,
      user: {
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image
      }
    })
    .from(platformConfigAuditTable)
    .leftJoin(platformConfigTable, eq(platformConfigAuditTable.config_id, platformConfigTable.id))
    .leftJoin(userTable, eq(platformConfigAuditTable.changed_by, userTable.id))
    .where(allConditions.length > 0 ? and(...allConditions) : undefined);

  const auditLogs = await query
    .orderBy(desc(platformConfigAuditTable.changed_at))
    .limit(limit)
    .offset(offset);

  return {
    data: auditLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
}

// Get all unique users who have made configuration changes
export async function getConfigAuditUsers() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error('Forbidden - Admin access required');
  }

  const users = await db
    .selectDistinct({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email
    })
    .from(platformConfigAuditTable)
    .innerJoin(userTable, eq(platformConfigAuditTable.changed_by, userTable.id))
    .orderBy(userTable.name);

  return users;
}