import { eq } from 'drizzle-orm';
import { db } from '@workspace/database';
import { 
  leadQualificationTable, 
  organizationTable, 
  userTable,
  leadAnalyticsEventTable 
} from '@workspace/database/schema';

export type LeadDetail = {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  
  // Required questions
  mainConcern: string | null;
  complianceRequirements: string[] | null;
  complianceOther: string | null;
  itTeamSize: string | null;
  companySize: string | null;
  recentIncidents: string | null;
  
  // Optional responses
  optionalResponses: Record<string, unknown> | null;
  specificNeeds: string | null;
  
  // Scoring
  leadScore: number;
  leadClassification: 'A1' | 'B1' | 'C1' | 'D1';
  scoreComponents: {
    urgency: number;
    budget: number;
    fit: number;
    engagement: number;
    decision: number;
  } | null;
  
  // Metrics
  completionTime: number | null;
  questionsAnswered: number | null;
  optionalAnswered: number | null;
  deviceType: string | null;
  abandonmentPoint: string | null;
  timePerQuestion: Record<string, number> | null;
  
  createdAt: Date;
  updatedAt: Date;
};

export type LeadAnalyticsEvent = {
  id: string;
  eventType: string;
  questionId: string | null;
  previousValue: string | null;
  newValue: string | null;
  timeSpent: number | null;
  createdAt: Date;
};

export async function getLeadById(leadId: string): Promise<LeadDetail | null> {
  const leads = await db
    .select({
      id: leadQualificationTable.id,
      organizationId: leadQualificationTable.organizationId,
      organizationName: organizationTable.name,
      userId: leadQualificationTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
      
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
    .leftJoin(userTable, eq(leadQualificationTable.userId, userTable.id))
    .where(eq(leadQualificationTable.id, leadId))
    .limit(1);

  if (leads.length === 0) {
    return null;
  }

  // Get user phone if available
  const userDetails = await db
    .select({
      phone: userTable.phone,
    })
    .from(userTable)
    .where(eq(userTable.id, leads[0].userId))
    .limit(1);

  return {
    ...leads[0],
    userPhone: userDetails[0]?.phone,
  } as LeadDetail;
}

export async function getLeadEvents(leadId: string): Promise<LeadAnalyticsEvent[]> {
  const events = await db
    .select({
      id: leadAnalyticsEventTable.id,
      eventType: leadAnalyticsEventTable.eventType,
      questionId: leadAnalyticsEventTable.questionId,
      previousValue: leadAnalyticsEventTable.previousValue,
      newValue: leadAnalyticsEventTable.newValue,
      timeSpent: leadAnalyticsEventTable.timeSpent,
      createdAt: leadAnalyticsEventTable.createdAt,
    })
    .from(leadAnalyticsEventTable)
    .where(eq(leadAnalyticsEventTable.leadQualificationId, leadId))
    .orderBy(leadAnalyticsEventTable.createdAt);

  return events;
}

export function getResponseTimeRecommendation(classification: string): string {
  switch (classification) {
    case 'A1':
      return 'Contact within 2 hours - High priority lead';
    case 'B1':
      return 'Contact within 24 hours - Warm lead';
    case 'C1':
      return 'Contact within 72 hours - Cold lead';
    case 'D1':
      return 'Weekly follow-up - Information seeker';
    default:
      return 'Standard follow-up';
  }
}

export function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'A1':
      return 'destructive'; // red
    case 'B1':
      return 'warning'; // orange
    case 'C1':
      return 'secondary'; // yellow
    case 'D1':
      return 'outline'; // gray
    default:
      return 'default';
  }
}