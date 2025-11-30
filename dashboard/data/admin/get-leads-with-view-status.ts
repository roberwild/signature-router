import { desc, eq,  and, gte, lte } from 'drizzle-orm';
import { db } from '@workspace/database';
import { 
  leadQualificationTable, 
  organizationTable, 
  userTable,
  leadViewTable
} from '@workspace/database/schema';

export type LeadListItemWithViewStatus = {
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
  isViewed: boolean;
  viewedAt: Date | null;
  viewedBy: string | null;
};

export type LeadFilters = {
  classification?: 'A1' | 'B1' | 'C1' | 'D1';
  dateFrom?: Date;
  dateTo?: Date;
  viewStatus?: 'viewed' | 'unviewed' | 'all';
};

export async function getLeadsWithViewStatus(
  currentUserId: string,
  filters?: LeadFilters
): Promise<LeadListItemWithViewStatus[]> {
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
      viewedAt: leadViewTable.viewedAt,
      viewedBy: leadViewTable.viewedBy,
    })
    .from(leadQualificationTable)
    .leftJoin(organizationTable, eq(leadQualificationTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(leadQualificationTable.userId, userTable.id))
    .leftJoin(
      leadViewTable, 
      and(
        eq(leadViewTable.leadId, leadQualificationTable.id),
        eq(leadViewTable.viewedBy, currentUserId)
      )
    )
    .where(whereClause)
    .orderBy(desc(leadQualificationTable.leadScore), desc(leadQualificationTable.createdAt));

  // Transform results to include isViewed boolean
  const leadsWithViewStatus = leads.map(lead => ({
    ...lead,
    isViewed: !!lead.viewedAt,
    organizationId: lead.organizationId || null,
    organizationName: lead.organizationName || null,
    mainConcern: lead.mainConcern || null,
    companySize: lead.companySize || null,
    completionTime: lead.completionTime || null,
    questionsAnswered: lead.questionsAnswered || null,
    viewedAt: lead.viewedAt || null,
    viewedBy: lead.viewedBy || null,
  })) as LeadListItemWithViewStatus[];

  // Filter by view status if specified
  if (filters?.viewStatus && filters.viewStatus !== 'all') {
    return leadsWithViewStatus.filter(lead => 
      filters.viewStatus === 'viewed' ? lead.isViewed : !lead.isViewed
    );
  }

  return leadsWithViewStatus;
}