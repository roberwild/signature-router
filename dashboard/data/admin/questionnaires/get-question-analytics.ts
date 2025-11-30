import { db } from '@workspace/database';
import {
  questionnaireSessions,
  leads
} from '@workspace/database';
import {   gte, eq } from 'drizzle-orm';
import { cache } from 'react';

export interface QuestionMetrics {
  questionId: string;
  questionText: string;
  category: string;
  responseRate: number;
  avgResponseTime: number;
  skipRate: number;
  completionRate: number;
  totalViews: number;
  totalResponses: number;
  responseTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  trendData: Array<{
    date: string;
    responses: number;
    views: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    responseRate: number;
    avgTime: number;
  }>;
}

export interface QuestionAnalyticsData {
  questions: QuestionMetrics[];
  topPerformers: QuestionMetrics[];
  needsAttention: QuestionMetrics[];
  overallStats: {
    totalQuestions: number;
    avgResponseRate: number;
    avgCompletionTime: number;
    totalResponses: number;
  };
  insights: Array<{
    type: 'high_skip' | 'low_response' | 'slow_completion' | 'high_performer';
    questionId: string;
    metric: number;
    description: string;
  }>;
}

export const getQuestionAnalyticsData = cache(
  async (timeframe: string = '30d'): Promise<QuestionAnalyticsData> => {
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // First, get all sessions with their responses
      const sessions = await db
        .select({
          id: questionnaireSessions.id,
          leadId: questionnaireSessions.leadId,
          responses: questionnaireSessions.responses,
          startedAt: questionnaireSessions.startedAt,
          completedAt: questionnaireSessions.completedAt,
          questionsAnswered: questionnaireSessions.questionsAnswered,
          totalQuestions: questionnaireSessions.totalQuestions,
          leadCategory: leads.leadCategory,
        })
        .from(questionnaireSessions)
        .innerJoin(leads, eq(questionnaireSessions.leadId, leads.id))
        .where(gte(questionnaireSessions.startedAt, startDate));

      // Process the data in JavaScript
      const questionMap = new Map<string, {
        views: number;
        responses: number;
        totalTime: number;
        categories: Map<string, { views: number; responses: number; totalTime: number }>;
        dailyData: Map<string, { views: number; responses: number }>;
        questionText?: string;
      }>();

      // Process each session
      for (const session of sessions) {
        if (!session.responses || typeof session.responses !== 'object') continue;
        
        const sessionResponses = session.responses as Record<string, unknown> | null;
        const questions = (sessionResponses?.questions as Array<Record<string, unknown>>) || [];
        
        for (const question of questions) {
          const questionId = question.id as string;
          if (!questionId) continue;

          if (!questionMap.has(questionId)) {
            questionMap.set(questionId, {
              views: 0,
              responses: 0,
              totalTime: 0,
              categories: new Map(),
              dailyData: new Map(),
              questionText: (question.text as string) || (question.question as string) || questionId
            });
          }

          const questionData = questionMap.get(questionId)!;
          questionData.views++;
          
          if (question.answer !== undefined && question.answer !== null && question.answer !== '') {
            questionData.responses++;
          }
          
          // Add completion time if available
          if (session.completedAt && session.startedAt) {
            const timeDiff = (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
            questionData.totalTime += timeDiff;
          }
          
          // Track by category
          const category = session.leadCategory || 'Unknown';
          if (!questionData.categories.has(category)) {
            questionData.categories.set(category, { views: 0, responses: 0, totalTime: 0 });
          }
          const categoryData = questionData.categories.get(category)!;
          categoryData.views++;
          if (question.answer) {
            categoryData.responses++;
            if (session.completedAt && session.startedAt) {
              const timeDiff = (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
              categoryData.totalTime += timeDiff;
            }
          }
          
          // Track daily data
          const dateKey = new Date(session.startedAt).toISOString().split('T')[0];
          if (!questionData.dailyData.has(dateKey)) {
            questionData.dailyData.set(dateKey, { views: 0, responses: 0 });
          }
          const dailyData = questionData.dailyData.get(dateKey)!;
          dailyData.views++;
          if (question.answer) {
            dailyData.responses++;
          }
        }
      }

      // Convert to QuestionMetrics format
      const questions: QuestionMetrics[] = [];
      
      for (const [questionId, data] of questionMap.entries()) {
        const responseRate = data.views > 0 ? data.responses / data.views : 0;
        const avgResponseTime = data.responses > 0 ? data.totalTime / data.responses : 0;
        
        // Convert category performance
        const categoryPerformance = Array.from(data.categories.entries()).map(([category, catData]) => ({
          category,
          responseRate: catData.views > 0 ? catData.responses / catData.views : 0,
          avgTime: catData.responses > 0 ? catData.totalTime / catData.responses : 0
        }));
        
        // Convert daily trend data
        const trendData = Array.from(data.dailyData.entries())
          .map(([date, dayData]) => ({
            date,
            responses: dayData.responses,
            views: dayData.views
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        questions.push({
          questionId,
          questionText: data.questionText || `Question ${questionId}`,
          category: 'General', // You might want to categorize questions differently
          responseRate,
          avgResponseTime,
          skipRate: 1 - responseRate,
          completionRate: responseRate, // Simplified - you might calculate this differently
          totalViews: data.views,
          totalResponses: data.responses,
          responseTypes: [], // Would need more complex processing to determine types
          trendData,
          categoryPerformance
        });
      }

      // Calculate overall statistics
      const totalResponses = questions.reduce((sum, q) => sum + q.totalResponses, 0);
      const totalViews = questions.reduce((sum, q) => sum + q.totalViews, 0);
      const avgResponseRate = totalViews > 0 ? totalResponses / totalViews : 0;
      const avgCompletionTime = questions.reduce((sum, q) => sum + q.avgResponseTime, 0) / (questions.length || 1);

      // Identify top performers and questions needing attention
      const sortedByResponse = [...questions].sort((a, b) => b.responseRate - a.responseRate);
      const topPerformers = sortedByResponse.slice(0, 5);
      const needsAttention = sortedByResponse.filter(q => q.responseRate < 0.6);

      // Generate insights
      const insights: QuestionAnalyticsData['insights'] = [];
      
      for (const question of questions) {
        if (question.responseRate > 0.9) {
          insights.push({
            type: 'high_performer',
            questionId: question.questionId,
            metric: question.responseRate,
            description: `"${question.questionText}" has an excellent ${(question.responseRate * 100).toFixed(0)}% response rate`
          });
        } else if (question.responseRate < 0.5) {
          insights.push({
            type: 'low_response',
            questionId: question.questionId,
            metric: question.responseRate,
            description: `"${question.questionText}" needs improvement with only ${(question.responseRate * 100).toFixed(0)}% response rate`
          });
        }
        
        if (question.skipRate > 0.3) {
          insights.push({
            type: 'high_skip',
            questionId: question.questionId,
            metric: question.skipRate,
            description: `"${question.questionText}" is being skipped by ${(question.skipRate * 100).toFixed(0)}% of users`
          });
        }
        
        if (question.avgResponseTime > 60) {
          insights.push({
            type: 'slow_completion',
            questionId: question.questionId,
            metric: question.avgResponseTime,
            description: `"${question.questionText}" takes ${Math.round(question.avgResponseTime)} seconds on average`
          });
        }
      }

      return {
        questions,
        topPerformers,
        needsAttention,
        overallStats: {
          totalQuestions: questions.length,
          avgResponseRate,
          avgCompletionTime,
          totalResponses
        },
        insights
      };
    } catch (error) {
      console.error('Error fetching question analytics:', error);
      // Return empty data structure on error
      return {
        questions: [],
        topPerformers: [],
        needsAttention: [],
        overallStats: {
          totalQuestions: 0,
          avgResponseRate: 0,
          avgCompletionTime: 0,
          totalResponses: 0
        },
        insights: []
      };
    }
  }
);