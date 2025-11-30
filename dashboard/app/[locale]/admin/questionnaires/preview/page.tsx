import { Suspense } from 'react';
import { requirePermission } from '~/lib/admin/permissions';
import { QuestionnaireBreadcrumb } from '~/components/admin/questionnaires/questionnaire-breadcrumb';
import { QuestionnairePreview } from './questionnaire-preview';
import { getQuestionnaireConfigs } from '~/data/admin/questionnaires/get-questionnaire-configs';

export default async function QuestionnairePreviewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await requirePermission('SYSTEM_ADMIN');
  const { locale } = await params;

  const configs = await getQuestionnaireConfigs();

  return (
    <>
      <QuestionnaireBreadcrumb locale={locale} currentPage="Preview & Test" />
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Questionnaire Preview & Test Mode
            </h1>
            <p className="text-muted-foreground mt-2">
              Test onboarding and follow-up questionnaires without affecting real data
            </p>
          </div>

          <Suspense fallback={<div>Loading preview mode...</div>}>
            <QuestionnairePreview 
              onboardingQuestionnaires={configs.onboardingQuestionnaires}
              followUpQuestionnaires={configs.followUpQuestionnaires}
              locale={locale}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}