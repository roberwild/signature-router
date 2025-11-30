import { db } from '@workspace/database';
import { 
  questionnaireSessions,
  leads,
  questionConfigsTable
} from '@workspace/database';
import { sql, and, gte, lte, eq, count, avg, desc } from 'drizzle-orm';
import { cache } from 'react';

export type AnalyticsData = {
  metrics: {
    completionRate: number;
    averageResponseTime: number;
    abandonmentRate: number;
    questionsPerSession: number;
    totalSessions: number;
    activeSessions: number;
  };
  trends: {
    completionTrend: Array<{ time: string; value: number }>;
    responseTrend: Array<{ time: string; value: number }>;
    abandonmentTrend: Array<{ time: string; value: number }>;
  };
  categoryBreakdown: Array<{
    category: string;
    completions: number;
    responses: number;
    avgScore: number;
    conversionRate: number;
  }>;
  anomalies: Array<{
    id: string;
    type: 'completion_drop' | 'response_spike' | 'abandonment_increase';
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: Date;
  }>;
  topQuestions: Array<{
    questionId: string;
    questionText: string;
    responseRate: number;
    avgResponseTime: number;
    skipRate: number;
  }>;
};

/**
 * Get comprehensive analytics data for questionnaire system
 */
export const getAnalyticsData = cache(async (): Promise<AnalyticsData> => {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const _last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get basic metrics
  const [totalSessionsResult] = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(gte(questionnaireSessions.startedAt, last30Days));

  const [completedSessionsResult] = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, last30Days),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );

  const [activeSessionsResult] = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(sql`${questionnaireSessions.completedAt} IS NULL`);

  const [abandonedSessionsResult] = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, last30Days),
        sql`${questionnaireSessions.completedAt} IS NULL AND ${questionnaireSessions.abandonedAt} IS NOT NULL`
      )
    );

  const [avgQuestionsResult] = await db
    .select({ avgQuestions: avg(questionnaireSessions.questionsAnswered) })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, last30Days),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );

  // Calculate metrics
  const totalSessions = totalSessionsResult.count || 0;
  const completedSessions = completedSessionsResult.count || 0;
  const abandonedSessions = abandonedSessionsResult.count || 0;
  const activeSessions = activeSessionsResult.count || 0;
  
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  const abandonmentRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;
  const questionsPerSession = Number(avgQuestionsResult.avgQuestions) || 0;

  // Calculate average response time from real data
  const averageResponseTime = await calculateAverageResponseTime(last30Days);

  // Get trend data from real database
  const completionTrend = await generateTrendData('completion', last7Days);
  const responseTrend = await generateTrendData('response', last7Days);
  const abandonmentTrend = await generateTrendData('abandonment', last7Days);

  // Get category breakdown
  const categoryBreakdown = await getCategoryBreakdown(last30Days);

  // Detect anomalies (simplified example)
  const anomalies = await detectAnomalies();

  // Get top performing questions
  const topQuestions = await getTopQuestions(last30Days);

  return {
    metrics: {
      completionRate: Math.round(completionRate * 10) / 10,
      averageResponseTime,
      abandonmentRate: Math.round(abandonmentRate * 10) / 10,
      questionsPerSession: Math.round(questionsPerSession * 10) / 10,
      totalSessions,
      activeSessions
    },
    trends: {
      completionTrend,
      responseTrend,
      abandonmentTrend
    },
    categoryBreakdown,
    anomalies,
    topQuestions
  };
});

async function generateTrendData(
  type: 'completion' | 'response' | 'abandonment', 
  _startDate: Date
) {
  const data = [];
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  // Generate data for last 7 days
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - (i + 1) * dayInMs);
    const dayEnd = new Date(now.getTime() - i * dayInMs);
    
    let value = 0;
    
    if (type === 'completion') {
      // Get completion rate for this day
      const [totalDay] = await db
        .select({ count: count() })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, dayStart),
            lte(questionnaireSessions.startedAt, dayEnd)
          )
        );
      
      const [completedDay] = await db
        .select({ count: count() })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, dayStart),
            lte(questionnaireSessions.startedAt, dayEnd),
            sql`${questionnaireSessions.completedAt} IS NOT NULL`
          )
        );
      
      const total = totalDay.count || 0;
      const completed = completedDay.count || 0;
      value = total > 0 ? (completed / total) * 100 : 0;
      
    } else if (type === 'response') {
      // Get average responses per session for this day
      const [responseData] = await db
        .select({ avgResponses: avg(questionnaireSessions.questionsAnswered) })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, dayStart),
            lte(questionnaireSessions.startedAt, dayEnd)
          )
        );
      
      value = Number(responseData.avgResponses) || 0;
      
    } else if (type === 'abandonment') {
      // Get abandonment rate for this day
      const [totalDay] = await db
        .select({ count: count() })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, dayStart),
            lte(questionnaireSessions.startedAt, dayEnd)
          )
        );
      
      const [abandonedDay] = await db
        .select({ count: count() })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, dayStart),
            lte(questionnaireSessions.startedAt, dayEnd),
            sql`${questionnaireSessions.completedAt} IS NULL AND ${questionnaireSessions.abandonedAt} IS NOT NULL`
          )
        );
      
      const total = totalDay.count || 0;
      const abandoned = abandonedDay.count || 0;
      value = total > 0 ? (abandoned / total) * 100 : 0;
    }
    
    data.push({
      time: dayEnd.toISOString().split('T')[0],
      value: Math.round(value * 10) / 10
    });
  }
  
  return data;
}

async function getCategoryBreakdown(startDate: Date) {
  const categories: Array<'A1' | 'B1' | 'C1' | 'D1'> = ['A1', 'B1', 'C1', 'D1'];
  const breakdown = [];

  for (const category of categories) {
    // Get sessions for this category
    const [sessionsResult] = await db
      .select({ count: count() })
      .from(questionnaireSessions)
      .leftJoin(leads, eq(questionnaireSessions.leadId, leads.id))
      .where(
        and(
          gte(questionnaireSessions.startedAt, startDate),
          eq(leads.leadCategory, category)
        )
      );

    const [completedResult] = await db
      .select({ count: count() })
      .from(questionnaireSessions)
      .leftJoin(leads, eq(questionnaireSessions.leadId, leads.id))
      .where(
        and(
          gte(questionnaireSessions.startedAt, startDate),
          eq(leads.leadCategory, category),
          sql`${questionnaireSessions.completedAt} IS NOT NULL`
        )
      );

    const [avgScoreResult] = await db
      .select({ avgScore: avg(leads.leadScore) })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, startDate),
          eq(leads.leadCategory, category)
        )
      );

    const sessions = sessionsResult.count || 0;
    const completions = completedResult.count || 0;
    const avgScore = Number(avgScoreResult.avgScore) || 0;

    breakdown.push({
      category,
      completions,
      responses: sessions,
      avgScore: Math.round(avgScore * 10) / 10,
      conversionRate: sessions > 0 ? Math.round((completions / sessions) * 100 * 10) / 10 : 0
    });
  }

  return breakdown;
}

async function detectAnomalies() {
  const anomalies = [];
  const now = new Date();
  const last4Hours = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const last8Hours = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Check completion rate drop
  const [recent4h] = await db
    .select({ 
      total: count(),
      completed: sql<number>`COUNT(CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END)`
    })
    .from(questionnaireSessions)
    .where(gte(questionnaireSessions.startedAt, last4Hours));
  
  const [previous4h] = await db
    .select({ 
      total: count(),
      completed: sql<number>`COUNT(CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END)`
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, last8Hours),
        lte(questionnaireSessions.startedAt, last4Hours)
      )
    );
  
  const recentRate = recent4h.total > 0 ? (recent4h.completed / recent4h.total) * 100 : 0;
  const previousRate = previous4h.total > 0 ? (previous4h.completed / previous4h.total) * 100 : 0;
  
  if (previousRate > 0 && recentRate < previousRate * 0.85) {
    const dropPercentage = Math.round(((previousRate - recentRate) / previousRate) * 100);
    anomalies.push({
      id: `anomaly-${Date.now()}-1`,
      type: 'completion_drop' as const,
      severity: dropPercentage > 20 ? 'high' as const : 'medium' as const,
      description: `Completion rate dropped by ${dropPercentage}% in the last 4 hours (from ${Math.round(previousRate)}% to ${Math.round(recentRate)}%)`,
      detectedAt: now
    });
  }
  
  // Check abandonment spike
  const [recentAbandonment] = await db
    .select({ 
      total: count(),
      abandoned: sql<number>`COUNT(CASE WHEN ${questionnaireSessions.completedAt} IS NULL AND ${questionnaireSessions.abandonedAt} IS NOT NULL THEN 1 END)`
    })
    .from(questionnaireSessions)
    .where(gte(questionnaireSessions.startedAt, last4Hours));
  
  const [yesterdayAbandonment] = await db
    .select({ 
      total: count(),
      abandoned: sql<number>`COUNT(CASE WHEN ${questionnaireSessions.completedAt} IS NULL AND ${questionnaireSessions.abandonedAt} IS NOT NULL THEN 1 END)`
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, yesterday),
        lte(questionnaireSessions.startedAt, last4Hours)
      )
    );
  
  const recentAbandonRate = recentAbandonment.total > 0 ? (recentAbandonment.abandoned / recentAbandonment.total) * 100 : 0;
  const yesterdayAbandonRate = yesterdayAbandonment.total > 0 ? (yesterdayAbandonment.abandoned / yesterdayAbandonment.total) * 100 : 0;
  
  if (yesterdayAbandonRate > 0 && recentAbandonRate > yesterdayAbandonRate * 1.5) {
    const increasePercentage = Math.round(((recentAbandonRate - yesterdayAbandonRate) / yesterdayAbandonRate) * 100);
    anomalies.push({
      id: `anomaly-${Date.now()}-2`,
      type: 'abandonment_increase' as const,
      severity: increasePercentage > 100 ? 'high' as const : 'medium' as const,
      description: `Abandonment rate increased by ${increasePercentage}% compared to yesterday's average`,
      detectedAt: now
    });
  }
  
  // Check for response time spike (if sessions have duration)
  const [recentResponseTime] = await db
    .select({ 
      avgTime: avg(sql<number>`EXTRACT(EPOCH FROM (${questionnaireSessions.completedAt} - ${questionnaireSessions.startedAt}))`)
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, last4Hours),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );
  
  const [historicalResponseTime] = await db
    .select({ 
      avgTime: avg(sql<number>`EXTRACT(EPOCH FROM (${questionnaireSessions.completedAt} - ${questionnaireSessions.startedAt}))`)
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, yesterday),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );
  
  const recentAvg = Number(recentResponseTime.avgTime) || 0;
  const historicalAvg = Number(historicalResponseTime.avgTime) || 0;
  
  if (historicalAvg > 0 && recentAvg > historicalAvg * 2) {
    anomalies.push({
      id: `anomaly-${Date.now()}-3`,
      type: 'response_spike' as const,
      severity: 'low' as const,
      description: `Average response time doubled compared to historical average (${Math.round(recentAvg / 60)}min vs ${Math.round(historicalAvg / 60)}min)`,
      detectedAt: now
    });
  }
  
  return anomalies;
}

async function getTopQuestions(startDate: Date) {
  // Get all enabled questions
  const questions = await db
    .select({
      questionId: questionConfigsTable.questionId,
      questionText: questionConfigsTable.questionText,
      enabled: questionConfigsTable.enabled
    })
    .from(questionConfigsTable)
    .where(eq(questionConfigsTable.enabled, true))
    .orderBy(desc(questionConfigsTable.priority))
    .limit(10);

  // Calculate real performance metrics for each question
  const questionMetrics = await Promise.all(
    questions.map(async (q) => {
      // Get sessions that have responses for this question from JSONB
      const sessions = await db
        .select({
          responses: questionnaireSessions.responses,
          timePerQuestion: questionnaireSessions.timePerQuestion
        })
        .from(questionnaireSessions)
        .where(
          and(
            gte(questionnaireSessions.startedAt, startDate),
            sql`${questionnaireSessions.responses}::jsonb ? ${q.questionId}`
          )
        );

      const totalShown = sessions.length;
      let answered = 0;
      let totalResponseTime = 0;
      let responseCount = 0;

      sessions.forEach(session => {
        const responses = session.responses as Record<string, unknown>;
        const timePerQuestion = session.timePerQuestion as Record<string, number> | null;
        
        if (responses && responses[q.questionId]) {
          const response = responses[q.questionId];
          // Count as answered if response is not null/undefined and not marked as skipped
          if (response && response !== 'skipped') {
            answered++;
          }
          
          // Add response time if available
          if (timePerQuestion && timePerQuestion[q.questionId]) {
            totalResponseTime += timePerQuestion[q.questionId];
            responseCount++;
          }
        }
      });

      const avgTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const skipRate = totalShown > 0 ? ((totalShown - answered) / totalShown) * 100 : 0;

      return {
        questionId: q.questionId,
        questionText: q.questionText,
        responseRate: totalShown > 0 ? Math.round((answered / totalShown) * 100 * 10) / 10 : 0,
        avgResponseTime: Math.round(avgTime * 10) / 10, // Already in seconds from timePerQuestion
        skipRate: Math.round(skipRate * 10) / 10
      };
    })
  );

  // Sort by response rate descending
  return questionMetrics.sort((a, b) => b.responseRate - a.responseRate);
}

// Add new function to calculate average response time
async function calculateAverageResponseTime(startDate: Date): Promise<number> {
  // Calculate average time to complete questionnaire sessions
  const [avgTimeResult] = await db
    .select({
      avgTime: avg(
        sql<number>`EXTRACT(EPOCH FROM (${questionnaireSessions.completedAt} - ${questionnaireSessions.startedAt}))`
      )
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.startedAt, startDate),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );

  const avgTimeInSeconds = Number(avgTimeResult.avgTime) || 0;
  // Convert to minutes and round to 1 decimal
  return Math.round((avgTimeInSeconds / 60) * 10) / 10;
}

/**
 * Get metrics for a specific time range
 */
export const getMetricsTrend = cache(async (
  metric: 'completion' | 'response' | 'abandonment',
  timeRange: '24h' | '7d' | '30d'
): Promise<{ time: string; value: number }[]> => {
  const now = new Date();
  const startDate = new Date(
    now.getTime() - (
      timeRange === '24h' ? 24 * 60 * 60 * 1000 :
      timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 :
      30 * 24 * 60 * 60 * 1000
    )
  );
  
  return generateTrendData(metric, startDate);
});