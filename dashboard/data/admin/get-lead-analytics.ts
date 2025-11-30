import { sql, between } from 'drizzle-orm';
import { db } from '@workspace/database';
import {
  leads,
  questionnaireSessions
} from '@workspace/database';
import { subDays } from 'date-fns';

// Type for lead data from database
type Lead = typeof leads.$inferSelect;

// Type for questionnaire sessions
type _QuestionnaireSession = typeof questionnaireSessions.$inferSelect;

export type LeadAnalytics = {
  // Overall metrics
  totalLeads: number;
  completionRate: number;
  avgCompletionTime: number;
  avgScore: number;
  
  // Classification distribution
  leadsByClassification: {
    A1: number;
    B1: number;
    C1: number;
    D1: number;
  };
  
  // Conversion metrics
  conversionMetrics: {
    a1ConversionRate: number;
    b1ConversionRate: number;
    overallConversionRate: number;
    avgTimeToConversion: number;
  };
  
  // Abandonment analysis
  abandonmentRate: number;
  abandonmentByQuestion: Record<string, number>;
  
  // Device breakdown
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
  };
  
  // Time analysis
  avgTimePerQuestion: Record<string, number>;
  peakHours: Record<string, number>;
  
  // Trends (last 30 days)
  dailyLeads: Array<{
    date: string;
    count: number;
    avgScore: number;
  }>;
};

export async function getLeadAnalytics(dateRange?: { start: Date; end: Date }): Promise<LeadAnalytics> {
  const defaultStart = subDays(new Date(), 30);
  const defaultEnd = new Date();
  
  const start = dateRange?.start || defaultStart;
  const end = dateRange?.end || defaultEnd;
  
  const dateFilter = between(leads.createdAt, start, end);

  // Get all leads in date range
  const leadsData = await db
    .select()
    .from(leads)
    .where(dateFilter);

  // Calculate basic metrics
  const totalLeads = leadsData.length;
  // For completion, we'll check if they have responses in initialResponses
  const completedLeads = leadsData.filter(l => l.initialResponses && Object.keys(l.initialResponses as object).length > 0);
  const completionRate = totalLeads > 0 ? (completedLeads.length / totalLeads) * 100 : 0;

  // Average completion time - simplified calculation
  const avgCompletionTime = completedLeads.length > 0 ? 300 : 0; // Mock 5 minutes average

  const avgScore = leadsData.length > 0
    ? leadsData.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leadsData.length
    : 0;

  // Classification distribution
  const leadsByClassification = {
    A1: leadsData.filter(l => l.leadCategory === 'A1').length,
    B1: leadsData.filter(l => l.leadCategory === 'B1').length,
    C1: leadsData.filter(l => l.leadCategory === 'C1').length,
    D1: leadsData.filter(l => l.leadCategory === 'D1').length,
  };

  // Conversion metrics (simplified - would need service request integration)
  const conversionMetrics = await calculateConversionMetrics(leadsData);

  // Abandonment analysis - simplified for new schema
  const abandonedLeads = leadsData.filter(l => !l.initialResponses || Object.keys(l.initialResponses as object).length === 0);
  const abandonmentRate = totalLeads > 0 ? (abandonedLeads.length / totalLeads) * 100 : 0;

  const abandonmentByQuestion: Record<string, number> = {};
  // Simplified abandonment tracking
  abandonedLeads.forEach(_lead => {
    abandonmentByQuestion['initial_contact'] = (abandonmentByQuestion['initial_contact'] || 0) + 1;
  });

  // Device breakdown - simplified, would need device tracking in metadata
  const deviceBreakdown = {
    mobile: Math.floor(leadsData.length * 0.4), // Mock 40% mobile
    desktop: Math.floor(leadsData.length * 0.5), // Mock 50% desktop
    tablet: Math.floor(leadsData.length * 0.05), // Mock 5% tablet
    unknown: Math.floor(leadsData.length * 0.05), // Mock 5% unknown
  };

  // Time per question analysis - simplified
  const avgTimePerQuestion: Record<string, number> = {
    'contact_info': 45,
    'company_details': 60,
    'business_needs': 90,
    'budget_timeline': 75
  };

  // Peak hours analysis
  const peakHours: Record<string, number> = {};
  leadsData.forEach(lead => {
    const hour = new Date(lead.createdAt).getHours().toString();
    peakHours[hour] = (peakHours[hour] || 0) + 1;
  });

  // Daily trends
  const dailyLeads = await getDailyLeadTrends(start, end);

  return {
    totalLeads,
    completionRate,
    avgCompletionTime,
    avgScore,
    leadsByClassification,
    conversionMetrics,
    abandonmentRate,
    abandonmentByQuestion,
    deviceBreakdown,
    avgTimePerQuestion,
    peakHours,
    dailyLeads,
  };
}

async function calculateConversionMetrics(leads: Lead[]) {
  // This would integrate with service requests to track actual conversions
  // For now, returning mock data structure
  const a1Leads = leads.filter((l: Lead) => l.leadCategory === 'A1');
  const b1Leads = leads.filter((l: Lead) => l.leadCategory === 'B1');

  // Mock conversion rates (would query service requests)
  return {
    a1ConversionRate: a1Leads.length > 0 ? 40 : 0, // 40% mock rate
    b1ConversionRate: b1Leads.length > 0 ? 20 : 0, // 20% mock rate
    overallConversionRate: leads.length > 0 ? 15 : 0, // 15% mock rate
    avgTimeToConversion: 48, // 48 hours mock
  };
}

async function getDailyLeadTrends(start: Date, end: Date) {
  const result = await db
    .select({
      date: sql<string>`DATE(${leads.createdAt})`,
      count: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(${leads.leadScore})`,
    })
    .from(leads)
    .where(between(leads.createdAt, start, end))
    .groupBy(sql`DATE(${leads.createdAt})`)
    .orderBy(sql`DATE(${leads.createdAt})`);

  return result.map(row => ({
    date: row.date,
    count: Number(row.count),
    avgScore: Math.round(Number(row.avgScore) || 0),
  }));
}

export async function getConversionFunnel() {
  // Simplified funnel - would integrate with service requests
  const funnel = {
    leads: await db.select({ count: sql<number>`COUNT(*)` })
      .from(leads)
      .then(r => Number(r[0]?.count || 0)),
    
    qualified: 0, // Would query service requests with status = 'qualified'
    opportunity: 0, // Would query service requests with status = 'opportunity'
    customer: 0, // Would query service requests with status = 'won'
  };

  // Mock data for now
  funnel.qualified = Math.floor(funnel.leads * 0.6);
  funnel.opportunity = Math.floor(funnel.leads * 0.3);
  funnel.customer = Math.floor(funnel.leads * 0.15);

  return funnel;
}

export async function getQuestionPerformance() {
  // Analyze which questions have highest abandonment
  // Since leadAnalyticsEventTable doesn't exist in the current schema,
  // we'll use questionnaire sessions for analysis
  const sessions = await db
    .select({
      responses: questionnaireSessions.responses,
      questionsAnswered: questionnaireSessions.questionsAnswered,
      completedAt: questionnaireSessions.completedAt,
    })
    .from(questionnaireSessions);

  const questionStats: Record<string, {
    views: number;
    completions: number;
    avgTime: number;
    abandonments: number;
  }> = {};

  // Simplified question performance analysis
  sessions.forEach(session => {
    const questionKey = 'questionnaire_session';

    if (!questionStats[questionKey]) {
      questionStats[questionKey] = {
        views: 0,
        completions: 0,
        avgTime: 0,
        abandonments: 0,
      };
    }

    questionStats[questionKey].views++;

    if (session.completedAt) {
      questionStats[questionKey].completions++;
      questionStats[questionKey].avgTime += 120; // Mock 2 minutes average
    } else {
      questionStats[questionKey].abandonments++;
    }
  });

  // Calculate averages
  Object.keys(questionStats).forEach(question => {
    const stats = questionStats[question];
    if (stats.completions > 0) {
      stats.avgTime = Math.round(stats.avgTime / stats.completions);
    }
  });

  return questionStats;
}