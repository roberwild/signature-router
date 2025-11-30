'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Target, BarChart3, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useTranslations } from '~/hooks/use-translations';
import { LeadsOverview } from './leads-overview';
import { LeadsAnalytics } from './leads-analytics';
import { LeadsScoring } from './leads-scoring';
import type { LeadScoringData } from '~/data/admin/get-lead-scoring';

// Import types from leads-analytics for consistency
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

type LeadStats = {
  total: number;
  newThisWeek: number;
  qualified: number;
  avgScore: number;
  byClassification: LeadClassification;
};

type Lead = {
  id: string;
  organizationName: string | null;
  leadClassification: string;
  isViewed?: boolean;
  [key: string]: unknown;
};


interface LeadsTabsProps {
  leads: Lead[];
  stats: LeadStats;
  analytics: Analytics;
  funnel: Funnel;
  questionPerf: Record<string, unknown>;
  scoringData: LeadScoringData;
  locale: string;
  currentUserId: string;
}

export function LeadsTabs({
  leads,
  stats,
  analytics,
  funnel,
  questionPerf,
  scoringData,
  locale,
  currentUserId
}: LeadsTabsProps) {
  const { t } = useTranslations('admin/leads');
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    router.push(url.toString());
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full max-w-lg grid-cols-3">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          {t('tabs.overview')}
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {t('tabs.analytics')}
        </TabsTrigger>
        <TabsTrigger value="scoring" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {t('tabs.scoring')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <LeadsOverview 
          leads={leads}
          stats={stats}
          locale={locale}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <LeadsAnalytics
          analytics={analytics}
          funnel={funnel}
          questionPerf={questionPerf}
        />
      </TabsContent>

      <TabsContent value="scoring" className="mt-6">
        <LeadsScoring 
          scoringData={scoringData}
        />
      </TabsContent>
    </Tabs>
  );
}