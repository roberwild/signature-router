import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { AnalyticsDashboard } from './analytics-dashboard';
import { getAnalyticsData } from '~/data/admin/questionnaires/get-analytics-data';

export default async function AnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('questionnaire.read');
  const { locale } = await params;
  
  const analyticsData = await getAnalyticsData();
  
  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Analytics" />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Real-time Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor questionnaire performance metrics and system effectiveness in real-time
          </p>
        </div>
        
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDashboard initialData={analyticsData} locale={locale} />
        </Suspense>
      </div>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="h-80 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}