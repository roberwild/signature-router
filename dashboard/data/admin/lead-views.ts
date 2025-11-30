import { eq, and, sql, desc, isNull, gte } from 'drizzle-orm';
import { db } from '@workspace/database';
import { 
  leadQualificationTable, 
  leadViewTable,
  userTable
} from '@workspace/database/schema';

// Mark a lead as viewed by a specific user
export async function markLeadAsViewed(leadId: string, userId: string) {
  // Check if already viewed
  const existingView = await db
    .select()
    .from(leadViewTable)
    .where(
      and(
        eq(leadViewTable.leadId, leadId),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .limit(1);

  // If not viewed yet, create a view record
  if (existingView.length === 0) {
    await db.insert(leadViewTable).values({
      leadId,
      viewedBy: userId,
    });
  }

  return true;
}

// Get unviewed leads count for a specific user
export async function getUnviewedLeadsCount(userId: string) {
  const result = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${leadQualificationTable.id})`
    })
    .from(leadQualificationTable)
    .leftJoin(
      leadViewTable,
      and(
        eq(leadViewTable.leadId, leadQualificationTable.id),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .where(isNull(leadViewTable.id));

  return Number(result[0]?.count || 0);
}

// Get leads with their viewed status for a specific user
export async function getLeadsWithViewStatus(userId: string) {
  const leads = await db
    .select({
      lead: leadQualificationTable,
      viewedAt: leadViewTable.viewedAt,
      viewedBy: leadViewTable.viewedBy,
    })
    .from(leadQualificationTable)
    .leftJoin(
      leadViewTable,
      and(
        eq(leadViewTable.leadId, leadQualificationTable.id),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .orderBy(desc(leadQualificationTable.createdAt));

  return leads.map(row => ({
    ...row.lead,
    isViewed: !!row.viewedAt,
    viewedAt: row.viewedAt,
  }));
}

// Check if a specific lead has been viewed by a user
export async function isLeadViewed(leadId: string, userId: string) {
  const view = await db
    .select()
    .from(leadViewTable)
    .where(
      and(
        eq(leadViewTable.leadId, leadId),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .limit(1);

  return view.length > 0;
}

// Get view history for a lead
export async function getLeadViewHistory(leadId: string) {
  return await db
    .select({
      viewedBy: userTable.name,
      viewedByEmail: userTable.email,
      viewedAt: leadViewTable.viewedAt,
    })
    .from(leadViewTable)
    .leftJoin(userTable, eq(leadViewTable.viewedBy, userTable.id))
    .where(eq(leadViewTable.leadId, leadId))
    .orderBy(desc(leadViewTable.viewedAt));
}

// Mark all leads as viewed for a user
export async function markAllLeadsAsViewed(userId: string) {
  // Get all unviewed lead IDs
  const unviewedLeads = await db
    .select({
      id: leadQualificationTable.id
    })
    .from(leadQualificationTable)
    .leftJoin(
      leadViewTable,
      and(
        eq(leadViewTable.leadId, leadQualificationTable.id),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .where(isNull(leadViewTable.id));

  // Insert view records for all unviewed leads
  if (unviewedLeads.length > 0) {
    await db.insert(leadViewTable).values(
      unviewedLeads.map(lead => ({
        leadId: lead.id,
        viewedBy: userId,
      }))
    );
  }

  return unviewedLeads.length;
}

// Get unviewed leads created after a certain date
export async function getRecentUnviewedLeads(userId: string, since?: Date) {
  const query = db
    .select({
      lead: leadQualificationTable,
    })
    .from(leadQualificationTable)
    .leftJoin(
      leadViewTable,
      and(
        eq(leadViewTable.leadId, leadQualificationTable.id),
        eq(leadViewTable.viewedBy, userId)
      )
    )
    .where(
      and(
        isNull(leadViewTable.id),
        since ? gte(leadQualificationTable.createdAt, since) : undefined
      )
    )
    .orderBy(desc(leadQualificationTable.createdAt));

  return await query;
}