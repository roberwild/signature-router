'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Settings,
  BarChart3,
  Users,
  ClipboardList,
  AlertCircle,
  Clock,
  Target,
  MessageSquare,
  RefreshCw,
  TestTube,
  FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '~/hooks/use-translations';
import { DashboardMetricsCards, SystemHealthIndicator } from '~/components/admin/questionnaires/dashboard-metrics';
import { ActivityFeed } from '~/components/admin/questionnaires/activity-feed';
import type { DashboardMetrics } from '~/data/admin/questionnaires/get-dashboard-metrics';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DashboardContentProps {
  initialMetrics: DashboardMetrics;
  locale: string;
}

export function DashboardContent({ initialMetrics, locale }: DashboardContentProps) {
  const { t } = useTranslations('admin/questionnaires');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 5 minutes
  const { data: metrics, error, mutate } = useSWR<DashboardMetrics>(
    '/api/admin/questionnaires/metrics',
    fetcher,
    {
      fallbackData: initialMetrics,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: true
    }
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('dashboard.refresh')}
        </Button>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <div>
          <AlertTitle className="ml-6 mt-1">{t('dashboard.systemStatus')}</AlertTitle>
          <AlertDescription className="mt-1">
            <SystemHealthIndicator health={metrics?.systemHealth} />
          </AlertDescription>
        </div>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="configuration">{t('tabs.configuration')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('tabs.sessions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardMetricsCards metrics={metrics} loading={!metrics && !error} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.quickActions.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/config`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.configureQuestionnaires')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/preview`}>
                    <FlaskConical className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.previewTestMode')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/timing`}>
                    <Clock className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.configureTimingStrategies')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/questions`}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.questionAnalytics')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/triggers`}>
                    <Target className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.setupBehavioralTriggers')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.globalSettings')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/timeline`}>
                    <Users className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.leadTimeline')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/manual-send`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.sendManualFollowup')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/${locale}/admin/questionnaires/ab-testing`}>
                    <TestTube className="mr-2 h-4 w-4" />
                    {t('dashboard.quickActions.abTesting')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <ActivityFeed 
              activities={metrics?.recentActivity || []} 
              loading={!metrics && !error}
            />
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.configuration.timingConfiguration.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.configuration.timingConfiguration.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}/admin/questionnaires/timing`}>
                    {t('dashboard.configuration.timingConfiguration.action')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.configuration.questionManagement.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.configuration.questionManagement.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}/admin/questionnaires/questions`}>
                    {t('dashboard.configuration.questionManagement.action')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.configuration.behavioralTriggers.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.configuration.behavioralTriggers.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}/admin/questionnaires/triggers`}>
                    {t('dashboard.configuration.behavioralTriggers.action')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.configuration.globalSettings.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.configuration.globalSettings.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}/admin/questionnaires/settings`}>
                    {t('dashboard.configuration.globalSettings.action')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.analytics.performanceAnalytics.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.analytics.performanceAnalytics.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('dashboard.analytics.completionRate')}</p>
                  <div className="text-2xl font-bold">{metrics?.completionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.analytics.last30Days')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('dashboard.analytics.avgQuestionsPerSession')}</p>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.analytics.comingSoon')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('dashboard.analytics.abandonmentRate')}</p>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.analytics.comingSoon')}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/admin/questionnaires/analytics`}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t('dashboard.analytics.viewDetailedAnalytics')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.sessions.activeSessions.title')}</CardTitle>
              <CardDescription>
                {t('dashboard.sessions.activeSessions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.activeSessions === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{t('dashboard.sessions.noActiveSessions')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">
                    {metrics?.activeSessions} {metrics?.activeSessions === 1 ? t('dashboard.sessions.activeSession') : t('dashboard.sessions.activeSessions')}
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/${locale}/admin/questionnaires/sessions`}>
                      {t('dashboard.sessions.viewActiveSessions')}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}