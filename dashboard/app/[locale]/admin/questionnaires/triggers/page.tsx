import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { TriggerManagement } from './trigger-management';
import { getBehavioralTriggers } from '~/data/admin/questionnaires/get-behavioral-triggers';

export default async function TriggersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('questionnaire.write');
  const { locale } = await params;
  
  const triggers = await getBehavioralTriggers();
  
  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Triggers" />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Behavioral Trigger Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure contextual triggers to send relevant questionnaires based on lead behavior
          </p>
        </div>
        
        <Suspense fallback={<TriggersSkeleton />}>
          <TriggerManagement initialTriggers={triggers} locale={locale} />
        </Suspense>
      </div>
    </>
  );
}

function TriggersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}