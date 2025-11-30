import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { QuestionnaireManager } from './questionnaire-manager';
import { getQuestionnaireConfigs } from '~/data/admin/questionnaires/get-questionnaire-configs';

export default async function QuestionnaireConfigPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');
  const { locale } = await params;

  const configs = await getQuestionnaireConfigs();

  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Configuration" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Questionnaire Configuration
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure onboarding questionnaires and follow-up sequences
            </p>
          </div>

          <Suspense fallback={<div>Loading questionnaire configs...</div>}>
            <QuestionnaireManager initialData={configs} />
          </Suspense>
        </div>
      </div>
    </>
  );
}