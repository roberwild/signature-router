import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { TimingConfiguration } from './timing-configuration';
import { getTimingStrategies } from '~/data/admin/questionnaires/get-timing-strategies';

export default async function TimingStrategyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('questionnaire.write');
  const { locale } = await params;
  
  const strategies = await getTimingStrategies();
  
  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Timing" />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Timing Strategy Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure engagement timing for each lead category to optimize response rates
          </p>
        </div>
        
        <Suspense fallback={<TimingConfigSkeleton />}>
          <TimingConfiguration initialStrategies={strategies} locale={locale} />
        </Suspense>
      </div>
    </>
  );
}

function TimingConfigSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-96 bg-muted animate-pulse rounded" />
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}