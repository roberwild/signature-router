import { db } from '@workspace/database';
import {
  leads,
  questionnaireSessions,
  leadQualificationTable,
  leadAnalyticsEventTable
} from '@workspace/database';
import { eq, count,  desc, sql, gte, and } from 'drizzle-orm';
import { cache } from 'react';

export interface LeadScoringData {
  topLeads: Array<{
    id: string;
    email: string;
    score: number;
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
    lastActivity: Date;
    completedSessions: number;
    recommendations: string[];
  }>;
  scoreDistribution: Array<{
    scoreRange: string;
    count: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    avgScore: number;
    conversionRate: number;
  }>;
  insights: {
    totalLeads: number;
    highValueLeads: number;
    atRiskLeads: number;
    avgScore: number;
    improvementOpportunities: Array<{
      factor: string;
      impact: string;
      recommendation: string;
    }>;
  };
  factorAnalysis: {
    profileCompleteness: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
    responseQuality: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
    engagementLevel: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
    behavioralSignals: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
    demographicFit: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
    intentSignals: { avg: number; weight: number; impact: 'high' | 'medium' | 'low' };
  };
}

export const getLeadScoringData = cache(
  async (): Promise<LeadScoringData> => {
    // Get leads with their basic scoring info
    const leadsWithScores = await db
      .select({
        lead: leads,
        sessionCount: count(questionnaireSessions.id),
        completedSessions: count(
          sql`CASE WHEN ${questionnaireSessions.completedAt} IS NOT NULL THEN 1 END`
        ),
        lastSessionDate: sql<Date>`MAX(${questionnaireSessions.startedAt})`,
        hasQualification: count(leadQualificationTable.id),
        recentEvents: count(leadAnalyticsEventTable.id),
      })
      .from(leads)
      .leftJoin(questionnaireSessions, eq(questionnaireSessions.leadId, leads.id))
      .leftJoin(leadQualificationTable, eq(leadQualificationTable.userId, leads.userId))
      .leftJoin(
        leadAnalyticsEventTable,
        and(
          eq(leadAnalyticsEventTable.leadQualificationId, leadQualificationTable.id),
          gte(leadAnalyticsEventTable.createdAt, sql`NOW() - INTERVAL '30 days'`)
        )
      )
      .groupBy(leads.id)
      .orderBy(desc(leads.leadScore))
      .limit(100);

    // Calculate simulated scores for demonstration
    // In a real implementation, these would be calculated by the LeadScoringService
    const topLeads = leadsWithScores.slice(0, 20).map(row => {
      const simulatedScore = Math.max(0, Math.min(100, 
        (row.lead.leadScore || 0) + Math.random() * 20 - 10
      ));
      
      const category = simulatedScore >= 80 ? 'A1' : 
                      simulatedScore >= 60 ? 'B1' : 
                      simulatedScore >= 40 ? 'C1' : 'D1';
      
      const riskLevel = 
        row.completedSessions === 0 && row.sessionCount > 0 ? 'high' :
        simulatedScore < 40 ? 'medium' : 'low';

      const recommendations = [];
      if (row.completedSessions === 0) {
        recommendations.push('Follow up to complete questionnaire');
      }
      if (simulatedScore < 50) {
        recommendations.push('Nurture with educational content');
      }
      if (simulatedScore > 80) {
        recommendations.push('Priority for sales outreach');
      }

      return {
        id: row.lead.id,
        email: row.lead.email,
        score: Math.round(simulatedScore),
        category,
        riskLevel: riskLevel as 'low' | 'medium' | 'high',
        lastActivity: row.lastSessionDate || row.lead.createdAt,
        completedSessions: row.completedSessions,
        recommendations,
      };
    });

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const count = topLeads.filter(lead => 
        lead.score >= range.min && lead.score <= range.max
      ).length;
      
      return {
        scoreRange: range.range,
        count,
        percentage: topLeads.length > 0 ? (count / topLeads.length) * 100 : 0,
      };
    });

    // Category breakdown
    const categories = ['A1', 'B1', 'C1', 'D1'];
    const categoryBreakdown = categories.map(cat => {
      const categoryLeads = topLeads.filter(lead => lead.category === cat);
      const avgScore = categoryLeads.length > 0 
        ? categoryLeads.reduce((sum, lead) => sum + lead.score, 0) / categoryLeads.length
        : 0;
      
      // Simulated conversion rates
      const conversionRates = { A1: 0.25, B1: 0.15, C1: 0.08, D1: 0.03 };
      
      return {
        category: cat,
        count: categoryLeads.length,
        avgScore: Math.round(avgScore),
        conversionRate: conversionRates[cat as keyof typeof conversionRates] * 100,
      };
    });

    // Calculate insights
    const totalLeads = topLeads.length;
    const highValueLeads = topLeads.filter(l => l.score >= 80).length;
    const atRiskLeads = topLeads.filter(l => l.riskLevel === 'high').length;
    const avgScore = totalLeads > 0 
      ? topLeads.reduce((sum, l) => sum + l.score, 0) / totalLeads
      : 0;

    const improvementOpportunities = [
      {
        factor: 'Profile Completeness',
        impact: 'High',
        recommendation: 'Send follow-up emails to incomplete profiles'
      },
      {
        factor: 'Engagement Level',
        impact: 'Medium',
        recommendation: 'Create re-engagement campaigns for inactive leads'
      },
      {
        factor: 'Response Quality',
        impact: 'High',
        recommendation: 'Improve questionnaire UX and guidance'
      }
    ];

    // Factor analysis (simulated data)
    const factorAnalysis = {
      profileCompleteness: { avg: 65, weight: 0.20, impact: 'high' as const },
      responseQuality: { avg: 58, weight: 0.25, impact: 'high' as const },
      engagementLevel: { avg: 72, weight: 0.20, impact: 'medium' as const },
      behavioralSignals: { avg: 55, weight: 0.15, impact: 'medium' as const },
      demographicFit: { avg: 68, weight: 0.10, impact: 'low' as const },
      intentSignals: { avg: 63, weight: 0.10, impact: 'medium' as const },
    };

    return {
      topLeads,
      scoreDistribution,
      categoryBreakdown,
      insights: {
        totalLeads,
        highValueLeads,
        atRiskLeads,
        avgScore: Math.round(avgScore),
        improvementOpportunities,
      },
      factorAnalysis,
    };
  }
);