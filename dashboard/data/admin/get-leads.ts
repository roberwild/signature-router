import { desc, eq, sql, and, gte, lte } from 'drizzle-orm';
import { db } from '@workspace/database';
import { 
  leadQualificationTable, 
  organizationTable, 
  userTable 
} from '@workspace/database/schema';

export type LeadListItem = {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  mainConcern: string | null;
  companySize: string | null;
  leadScore: number;
  leadClassification: 'A1' | 'B1' | 'C1' | 'D1';
  createdAt: Date;
  completionTime: number | null;
  questionsAnswered: number | null;
};

export type LeadFilters = {
  classification?: 'A1' | 'B1' | 'C1' | 'D1';
  dateFrom?: Date;
  dateTo?: Date;
};

export async function getLeads(filters?: LeadFilters): Promise<LeadListItem[]> {
  const conditions = [];

  if (filters?.classification) {
    conditions.push(eq(leadQualificationTable.leadClassification, filters.classification));
  }

  if (filters?.dateFrom) {
    conditions.push(gte(leadQualificationTable.createdAt, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(leadQualificationTable.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const leads = await db
    .select({
      id: leadQualificationTable.id,
      organizationId: leadQualificationTable.organizationId,
      organizationName: organizationTable.name,
      userId: leadQualificationTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
      mainConcern: leadQualificationTable.mainConcern,
      companySize: leadQualificationTable.companySize,
      leadScore: leadQualificationTable.leadScore,
      leadClassification: leadQualificationTable.leadClassification,
      createdAt: leadQualificationTable.createdAt,
      completionTime: leadQualificationTable.completionTime,
      questionsAnswered: leadQualificationTable.questionsAnswered,
    })
    .from(leadQualificationTable)
    .leftJoin(organizationTable, eq(leadQualificationTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(leadQualificationTable.userId, userTable.id))
    .where(whereClause)
    .orderBy(desc(leadQualificationTable.leadScore), desc(leadQualificationTable.createdAt));

  return leads as LeadListItem[];
}

export async function getLeadStats() {
  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      a1Count: sql<number>`count(*) filter (where ${leadQualificationTable.leadClassification} = 'A1')`,
      b1Count: sql<number>`count(*) filter (where ${leadQualificationTable.leadClassification} = 'B1')`,
      c1Count: sql<number>`count(*) filter (where ${leadQualificationTable.leadClassification} = 'C1')`,
      d1Count: sql<number>`count(*) filter (where ${leadQualificationTable.leadClassification} = 'D1')`,
      avgScore: sql<number>`avg(${leadQualificationTable.leadScore})`,
      avgCompletionTime: sql<number>`avg(${leadQualificationTable.completionTime})`,
    })
    .from(leadQualificationTable);

  return stats[0] || {
    total: 0,
    a1Count: 0,
    b1Count: 0,
    c1Count: 0,
    d1Count: 0,
    avgScore: 0,
    avgCompletionTime: 0
  };
}