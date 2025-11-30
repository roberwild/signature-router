import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { QuestionAnalytics } from './question-analytics-simple';
import { getQuestionAnalyticsData } from '~/data/admin/questionnaires/get-question-analytics';

export default async function QuestionAnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');
  const { locale } = await params;

  const analyticsData = await getQuestionAnalyticsData();

  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Questions" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Question Performance Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze individual question metrics and performance patterns
            </p>
          </div>

          <Suspense fallback={<div>Loading question analytics...</div>}>
            <QuestionAnalytics initialData={analyticsData} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
