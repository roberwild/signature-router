import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { CategoryAnalytics } from './category-analytics';
import { getCategoryAnalyticsData } from '~/data/admin/questionnaires/get-category-analytics';

export default async function CategoryAnalyticsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');
  const { locale } = await params;

  const analyticsData = await getCategoryAnalyticsData();

  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Categories" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Lead Category Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze performance metrics by lead category and segment
            </p>
          </div>

          <Suspense fallback={<div>Loading analytics...</div>}>
            <CategoryAnalytics initialData={analyticsData} />
          </Suspense>
        </div>
      </div>
    </>
  );
}