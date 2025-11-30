'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Smartphone,
  Monitor,
  AlertCircle,
  CheckCircle,
  Activity,
  TrendingDown
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { useTranslations } from '~/hooks/use-translations';

function formatTime(seconds: number): string {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp = true 
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendUp ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelStage({ 
  name, 
  value, 
  percentage, 
  color 
}: { 
  name: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 ${color} flex items-center justify-center text-xs font-bold text-white`}
          style={{ width: `${percentage}%` }}
        >
          {percentage}%
        </div>
      </div>
    </div>
  );
}

type LeadClassification = {
  A1: number;
  B1: number;
  C1: number;
  D1: number;
};

type DeviceBreakdown = {
  desktop: number;
  mobile: number;
  tablet: number;
};

type ConversionMetrics = {
  a1ConversionRate: number;
  b1ConversionRate: number;
  overallConversionRate: number;
  avgTimeToConversion: number;
};

type DailyLead = {
  date: string;
  count: number;
  avgScore: number;
};

type Analytics = {
  totalLeads: number;
  completionRate: number;
  avgCompletionTime: number;
  avgScore: number;
  leadsByClassification: LeadClassification;
  deviceBreakdown: DeviceBreakdown;
  abandonmentRate: number;
  abandonmentByQuestion: Record<string, number>;
  dailyLeads: DailyLead[];
  conversionMetrics: ConversionMetrics;
};

type Funnel = {
  leads: number;
  qualified: number;
  serviceRequested?: number;
  customer: number;
};

interface LeadsAnalyticsProps {
  analytics: Analytics;
  funnel: Funnel;
  questionPerf?: Record<string, unknown>;
}

export function LeadsAnalytics({ analytics, funnel, questionPerf: _ }: LeadsAnalyticsProps) {
  const { t } = useTranslations('admin/leads');

  // Calculate funnel percentages
  const funnelData = [
    { name: t('analytics.conversionFunnel.leads'), value: funnel.leads, percentage: 100, color: 'bg-blue-500' },
    {
      name: t('analytics.conversionFunnel.qualified'),
      value: funnel.qualified,
      percentage: funnel.leads > 0 ? Math.round((funnel.qualified / funnel.leads) * 100) : 0,
      color: 'bg-green-500'
    },
    {
      name: t('analytics.conversionFunnel.serviceRequested'),
      value: funnel.serviceRequested || 0,
      percentage: funnel.leads > 0 ? Math.round(((funnel.serviceRequested || 0) / funnel.leads) * 100) : 0,
      color: 'bg-yellow-500'
    },
    {
      name: t('analytics.conversionFunnel.serviceCompleted'),
      value: funnel.customer,
      percentage: funnel.leads > 0 ? Math.round((funnel.customer / funnel.leads) * 100) : 0,
      color: 'bg-purple-500'
    },
  ];

  // Prepare chart data for daily trends
  const chartData = analytics.dailyLeads.slice(-7); // Last 7 days

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('analytics.keyMetrics.totalLeads')}
          value={analytics.totalLeads}
          subtitle={t('analytics.keyMetrics.totalLeadsSubtitle')}
          icon={Users}
          trend={t('analytics.keyMetrics.totalLeadsTrend')}
          trendUp={true}
        />
        <MetricCard
          title={t('analytics.keyMetrics.completionRate')}
          value={`${Math.round(analytics.completionRate)}%`}
          subtitle={t('analytics.keyMetrics.completionRateSubtitle')}
          icon={CheckCircle}
          trend={t('analytics.keyMetrics.completionRateTrend')}
          trendUp={true}
        />
        <MetricCard
          title={t('analytics.keyMetrics.avgCompletionTime')}
          value={formatTime(Math.round(analytics.avgCompletionTime))}
          subtitle={t('analytics.keyMetrics.avgCompletionTimeSubtitle')}
          icon={Clock}
        />
        <MetricCard
          title={t('analytics.keyMetrics.averageScore')}
          value={Math.round(analytics.avgScore)}
          subtitle={t('analytics.keyMetrics.averageScoreSubtitle')}
          icon={Target}
        />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.conversionFunnel.title')}</CardTitle>
          <CardDescription>{t('analytics.conversionFunnel.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelData.map((stage) => (
            <FunnelStage key={stage.name} {...stage} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Classification Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.leadDistribution.title')}</CardTitle>
            <CardDescription>{t('analytics.leadDistribution.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{t('analytics.leadDistribution.a1Hot')}</Badge>
                  <span className="text-sm text-muted-foreground">{t('analytics.leadDistribution.a1HotDescription')}</span>
                </div>
                <span className="font-bold">{analytics.leadsByClassification.A1}</span>
              </div>
              <Progress
                value={(analytics.leadsByClassification.A1 / analytics.totalLeads) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-500">{t('analytics.leadDistribution.b1Warm')}</Badge>
                  <span className="text-sm text-muted-foreground">{t('analytics.leadDistribution.b1WarmDescription')}</span>
                </div>
                <span className="font-bold">{analytics.leadsByClassification.B1}</span>
              </div>
              <Progress
                value={(analytics.leadsByClassification.B1 / analytics.totalLeads) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t('analytics.leadDistribution.c1Cold')}</Badge>
                  <span className="text-sm text-muted-foreground">{t('analytics.leadDistribution.c1ColdDescription')}</span>
                </div>
                <span className="font-bold">{analytics.leadsByClassification.C1}</span>
              </div>
              <Progress
                value={(analytics.leadsByClassification.C1 / analytics.totalLeads) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t('analytics.leadDistribution.d1Info')}</Badge>
                  <span className="text-sm text-muted-foreground">{t('analytics.leadDistribution.d1InfoDescription')}</span>
                </div>
                <span className="font-bold">{analytics.leadsByClassification.D1}</span>
              </div>
              <Progress
                value={(analytics.leadsByClassification.D1 / analytics.totalLeads) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.deviceAnalysis.title')}</CardTitle>
            <CardDescription>{t('analytics.deviceAnalysis.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span>{t('analytics.deviceAnalysis.desktop')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.deviceBreakdown.desktop}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((analytics.deviceBreakdown.desktop / analytics.totalLeads) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={(analytics.deviceBreakdown.desktop / analytics.totalLeads) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span>{t('analytics.deviceAnalysis.mobile')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.deviceBreakdown.mobile}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((analytics.deviceBreakdown.mobile / analytics.totalLeads) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={(analytics.deviceBreakdown.mobile / analytics.totalLeads) * 100}
                className="h-2"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span>{t('analytics.deviceAnalysis.tablet')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{analytics.deviceBreakdown.tablet}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((analytics.deviceBreakdown.tablet / analytics.totalLeads) * 100)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={(analytics.deviceBreakdown.tablet / analytics.totalLeads) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abandonment Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('analytics.abandonmentAnalysis.title')}</CardTitle>
              <CardDescription>{t('analytics.abandonmentAnalysis.subtitle')}</CardDescription>
            </div>
            <Badge variant="outline">
              {Math.round(analytics.abandonmentRate)}% {t('analytics.abandonmentAnalysis.abandonmentRate')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.abandonmentByQuestion).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.abandonmentByQuestion)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 5)
                .map(([question, count]) => (
                  <div key={question} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{question}</span>
                    </div>
                    <Badge variant="secondary">{count as number} {t('analytics.abandonmentAnalysis.abandonments')}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t('analytics.abandonmentAnalysis.noDataAvailable')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.dailyTrend.title')}</CardTitle>
          <CardDescription>{t('analytics.dailyTrend.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-3">
              {chartData.map((day: DailyLead) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{day.count} {t('analytics.dailyTrend.leads')}</Badge>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{t('analytics.dailyTrend.avg')}: {day.avgScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t('analytics.dailyTrend.noDataAvailable')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.conversionPerformance.title')}</CardTitle>
          <CardDescription>{t('analytics.conversionPerformance.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {analytics.conversionMetrics.a1ConversionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.conversionPerformance.a1LeadConversion')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {analytics.conversionMetrics.b1ConversionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.conversionPerformance.b1LeadConversion')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.conversionMetrics.overallConversionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.conversionPerformance.overallConversion')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {analytics.conversionMetrics.avgTimeToConversion}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.conversionPerformance.avgTimeToConvert')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}