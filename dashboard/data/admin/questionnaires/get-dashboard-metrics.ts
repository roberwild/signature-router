import { db } from '@workspace/database';
import { 
  questionnaireSessions,
  leads
} from '@workspace/database';
import { sql, and, gte,  eq, count, avg } from 'drizzle-orm';
import { cache } from 'react';

export type DashboardMetrics = {
  completionRate: number;
  activeSessions: number;
  todaysResponses: number;
  avgLeadScore: number | null;
  recentActivity: RecentActivity[];
  systemHealth: SystemHealth;
};

export type RecentActivity = {
  id: string;
  leadName: string;
  leadEmail: string;
  category: string;
  completedAt: Date;
  questionsAnswered: number;
  score: number | null;
};

export type SystemHealth = {
  status: 'operational' | 'degraded' | 'down';
  activeSessionCount: number;
  avgResponseTime: number;
  errorRate: number;
};

/**
 * Get dashboard metrics for questionnaire system
 */
export const getDashboardMetrics = cache(async (): Promise<DashboardMetrics> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get completion rate (last 30 days)
  const completionStats = await db
    .select({
      total: count(),
      completed: count(
        sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
      )
    })
    .from(questionnaireSessions)
    .where(gte(questionnaireSessions.startedAt, last30Days));

  const completionRate = completionStats[0]?.total 
    ? (completionStats[0].completed / completionStats[0].total) * 100 
    : 0;

  // Get active sessions count
  const activeSessionsResult = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(sql`${questionnaireSessions.completedAt} IS NULL`);

  const activeSessions = activeSessionsResult[0]?.count || 0;

  // Get today's responses count
  const todaysResponsesResult = await db
    .select({ count: count() })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.completedAt, todayStart),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    );

  const todaysResponses = todaysResponsesResult[0]?.count || 0;

  // Get average lead score
  const avgScoreResult = await db
    .select({ avgScore: avg(leads.leadScore) })
    .from(leads)
    .where(gte(leads.createdAt, last30Days));

  const avgLeadScore = avgScoreResult[0]?.avgScore 
    ? Number(avgScoreResult[0].avgScore) 
    : null;

  // Get recent activity (last 20 completions)
  const recentActivityData = await db
    .select({
      id: questionnaireSessions.id,
      leadId: questionnaireSessions.leadId,
      completedAt: questionnaireSessions.completedAt,
      questionsAnswered: questionnaireSessions.questionsAnswered,
      leadEmail: leads.email,
      leadCategory: leads.leadCategory,
      score: leads.leadScore
    })
    .from(questionnaireSessions)
    .leftJoin(leads, eq(questionnaireSessions.leadId, leads.id))
    .where(sql`${questionnaireSessions.completedAt} IS NOT NULL`)
    .orderBy(sql`${questionnaireSessions.completedAt} DESC`)
    .limit(20);

  const recentActivity: RecentActivity[] = recentActivityData.map(item => ({
    id: item.id,
    leadName: item.leadEmail?.split('@')[0] || 'Unknown',
    leadEmail: item.leadEmail || '',
    category: item.leadCategory || 'D1',
    completedAt: item.completedAt || new Date(),
    questionsAnswered: item.questionsAnswered || 0,
    score: item.score || 0
  }));

  // Calculate system health
  const systemHealth: SystemHealth = {
    status: 'operational',
    activeSessionCount: activeSessions,
    avgResponseTime: 0, // This would come from monitoring service
    errorRate: 0 // This would come from monitoring service
  };

  return {
    completionRate: Math.round(completionRate * 10) / 10,
    activeSessions,
    todaysResponses,
    avgLeadScore: avgLeadScore ? Math.round(avgLeadScore * 10) / 10 : null,
    recentActivity,
    systemHealth
  };
});

/**
 * Get metrics for a specific time range
 */
export const getMetricsTrend = cache(async (
  timeRange: '24h' | '7d' | '30d'
): Promise<{ time: string; value: number }[]> => {
  const now = new Date();
  let startDate: Date;
  let _groupBy: string;

  switch (timeRange) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      _groupBy = 'hour';
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      _groupBy = 'day';
      break;
    case '30d': {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const _groupBy = 'day';
      break;
    }
  }

  // This is a simplified version - would need proper time grouping in production
  const data = await db
    .select({
      time: questionnaireSessions.completedAt,
      count: count()
    })
    .from(questionnaireSessions)
    .where(
      and(
        gte(questionnaireSessions.completedAt, startDate),
        sql`${questionnaireSessions.completedAt} IS NOT NULL`
      )
    )
    .groupBy(questionnaireSessions.completedAt)
    .orderBy(questionnaireSessions.completedAt);

  return data.map(item => ({
    time: item.time?.toISOString() || new Date().toISOString(),
    value: item.count
  }));
});