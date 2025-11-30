import { db, questionnaireSessions, leads } from '@workspace/database';
import { sql, and, gte, lte, eq, count, avg, desc } from 'drizzle-orm';
import { cache } from 'react';

export interface CategoryMetrics {
  category: string;
  totalLeads: number;
  completionRate: number;
  avgSessionDuration: number;
  avgQuestionsAnswered: number;
  conversionRate: number;
  bounceRate: number;
  topPerformingQuestions: Array<{
    question: string;
    completionRate: number;
    avgResponseTime: number;
  }>;
  performanceByTime: Array<{
    date: string;
    completions: number;
    starts: number;
    rate: number;
  }>;
}

export interface CategoryAnalyticsData {
  categories: CategoryMetrics[];
  summary: {
    totalCategories: number;
    bestPerformingCategory: string;
    worstPerformingCategory: string;
    overallCompletionRate: number;
  };
  comparisons: Array<{
    category: string;
    completionTrend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  }>;
}

export const getCategoryAnalyticsData = cache(
  async (timeframe: string = '30d'): Promise<CategoryAnalyticsData> => {
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all categories with their metrics
    const categoryQuery = await db
      .select({
        category: leads.leadCategory,
        totalSessions: count(questionnaireSessions.id),
        completedSessions: count(
          sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
        ),
        avgDuration: avg(
          sql`EXTRACT(EPOCH FROM (${questionnaireSessions.completedAt} - ${questionnaireSessions.startedAt}))`
        ),
        avgQuestions: avg(questionnaireSessions.questionsAnswered),
      })
      .from(questionnaireSessions)
      .innerJoin(leads, eq(questionnaireSessions.leadId, leads.id))
      .where(gte(questionnaireSessions.startedAt, startDate))
      .groupBy(leads.leadCategory)
      .orderBy(desc(count(questionnaireSessions.id)));

    // Calculate completion rates and build category metrics
    const categories: CategoryMetrics[] = await Promise.all(
      categoryQuery.map(async (cat) => {
        const completionRate = cat.totalSessions > 0 
          ? (cat.completedSessions / cat.totalSessions) * 100 
          : 0;

        // Get top performing questions for this category
        const topQuestions = await db
          .select({
            question: sql<string>`jsonb_extract_path_text(${questionnaireSessions.responses}, 'questions', '0', 'text')`,
            completionRate: sql<number>`
              (COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::float / COUNT(*)::float) * 100
            `,
            avgResponseTime: avg(
              sql`EXTRACT(EPOCH FROM (completed_at - started_at))`
            )
          })
          .from(questionnaireSessions)
          .innerJoin(leads, eq(questionnaireSessions.leadId, leads.id))
          .where(
            and(
              eq(leads.leadCategory, cat.category as 'A1' | 'B1' | 'C1' | 'D1'),
              gte(questionnaireSessions.startedAt, startDate)
            )
          )
          .groupBy(sql`jsonb_extract_path_text(${questionnaireSessions.responses}, 'questions', '0', 'text')`)
          .limit(5);

        // Get performance over time
        const performanceByTime = await db
          .select({
            date: sql<string>`DATE(${questionnaireSessions.startedAt})`,
            completions: count(
              sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
            ),
            starts: count(questionnaireSessions.id),
          })
          .from(questionnaireSessions)
          .innerJoin(leads, eq(questionnaireSessions.leadId, leads.id))
          .where(
            and(
              eq(leads.leadCategory, cat.category as 'A1' | 'B1' | 'C1' | 'D1'),
              gte(questionnaireSessions.startedAt, startDate)
            )
          )
          .groupBy(sql`DATE(${questionnaireSessions.startedAt})`)
          .orderBy(sql`DATE(${questionnaireSessions.startedAt})`);

        const bounceRate = cat.totalSessions > 0 
          ? ((cat.totalSessions - cat.completedSessions) / cat.totalSessions) * 100 
          : 0;

        return {
          category: cat.category || 'Unknown',
          totalLeads: cat.totalSessions,
          completionRate,
          avgSessionDuration: Number(cat.avgDuration) || 0,
          avgQuestionsAnswered: Number(cat.avgQuestions) || 0,
          conversionRate: completionRate, // Assuming completion = conversion for now
          bounceRate,
          topPerformingQuestions: topQuestions.map(q => ({
            question: q.question || 'Unknown Question',
            completionRate: Number(q.completionRate) || 0,
            avgResponseTime: Number(q.avgResponseTime) || 0
          })),
          performanceByTime: performanceByTime.map(p => ({
            date: p.date,
            completions: p.completions,
            starts: p.starts,
            rate: p.starts > 0 ? (p.completions / p.starts) * 100 : 0
          }))
        };
      })
    );

    // Calculate summary metrics
    const totalSessions = categories.reduce((sum, cat) => sum + cat.totalLeads, 0);
    const totalCompletions = categories.reduce(
      (sum, cat) => sum + (cat.totalLeads * cat.completionRate / 100), 
      0
    );
    const overallCompletionRate = totalSessions > 0 ? (totalCompletions / totalSessions) * 100 : 0;

    const bestCategory = categories.reduce((best, cat) => 
      cat.completionRate > best.completionRate ? cat : best, categories[0]
    );
    
    const worstCategory = categories.reduce((worst, cat) => 
      cat.completionRate < worst.completionRate ? cat : worst, categories[0]
    );

    // Calculate trend comparisons (comparing to previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    
    const comparisons = await Promise.all(
      categories.map(async (cat) => {
        const prevPeriodData = await db
          .select({
            completedSessions: count(
              sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
            ),
            totalSessions: count(questionnaireSessions.id),
          })
          .from(questionnaireSessions)
          .innerJoin(leads, eq(questionnaireSessions.leadId, leads.id))
          .where(
            and(
              eq(leads.leadCategory, cat.category as 'A1' | 'B1' | 'C1' | 'D1'),
              gte(questionnaireSessions.startedAt, prevStartDate),
              lte(questionnaireSessions.startedAt, startDate)
            )
          );

        const prevCompletionRate = prevPeriodData[0]?.totalSessions > 0 
          ? (prevPeriodData[0].completedSessions / prevPeriodData[0].totalSessions) * 100
          : 0;

        const trendPercentage = prevCompletionRate > 0 
          ? ((cat.completionRate - prevCompletionRate) / prevCompletionRate) * 100
          : 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (trendPercentage > 5) trend = 'up';
        else if (trendPercentage < -5) trend = 'down';

        return {
          category: cat.category,
          completionTrend: trend,
          trendPercentage: Math.abs(trendPercentage)
        };
      })
    );

    return {
      categories,
      summary: {
        totalCategories: categories.length,
        bestPerformingCategory: bestCategory?.category || 'None',
        worstPerformingCategory: worstCategory?.category || 'None',
        overallCompletionRate
      },
      comparisons
    };
  }
);