import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { ABTestingDashboard } from './ab-testing-dashboard';
import { getABExperiments } from '~/data/admin/get-ab-experiments';

export default async function ABTestingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');
  const { locale } = await params;

  const experiments = await getABExperiments();

  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="A/B Testing" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              A/B Testing Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage A/B tests to optimize questionnaire performance
            </p>
          </div>

          <Suspense fallback={<div>Loading experiments...</div>}>
            <ABTestingDashboard initialData={experiments} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
