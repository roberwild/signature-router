import * as React from 'react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeftIcon } from 'lucide-react';

import { getAuthContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';
import { buttonVariants } from '@workspace/ui/components/button';
import { Logo } from '@workspace/ui/components/logo';
import { cn } from '@workspace/ui/lib/utils';
import { db, eq, desc } from '@workspace/database/client';
import { leadQualificationTable, questionnaireConfigTable } from '@workspace/database/schema';

import { OnboardingWizard } from '~/components/onboarding/onboarding-wizard';
import { createTitle } from '~/lib/formatters';
import { OnboardingStep } from '~/schemas/onboarding/complete-onboarding-schema';
import { defaultQuestionnaire, type QuestionnaireConfig } from '~/data/lead-qualification/default-questionnaire';

export const metadata: Metadata = {
  title: createTitle('New Organization')
};

export default async function OnboardingOnlyOrganizationPage(): Promise<React.JSX.Element> {
  const ctx = await getAuthContext();
  if (!ctx.session.user.completedOnboarding) {
    return redirect(routes.dashboard.onboarding.Index);
  }

  // Check if user has any completed questionnaires
  const existingQuestionnaires = await db
    .select({ id: leadQualificationTable.id })
    .from(leadQualificationTable)
    .where(eq(leadQualificationTable.userId, ctx.session.user.id))
    .limit(1);

  const hasCompletedQuestionnaire = existingQuestionnaires.length > 0;
  
  // Include questionnaire step if user hasn't completed one yet
  const activeSteps = hasCompletedQuestionnaire 
    ? [OnboardingStep.Organization, OnboardingStep.InviteTeam]
    : [OnboardingStep.Organization, OnboardingStep.LeadQualification, OnboardingStep.InviteTeam];

  // Fetch active questionnaire configuration
  let questionnaire: QuestionnaireConfig = defaultQuestionnaire;
  
  if (!hasCompletedQuestionnaire) {
    const activeConfig = await db
      .select({ config: questionnaireConfigTable.config })
      .from(questionnaireConfigTable)
      .where(eq(questionnaireConfigTable.isActive, true))
      .orderBy(desc(questionnaireConfigTable.version))
      .limit(1);

    if (activeConfig.length > 0 && activeConfig[0].config) {
      questionnaire = activeConfig[0].config as QuestionnaireConfig;
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 mx-auto flex min-w-80 items-center justify-center p-4">
        <Logo />
      </div>
      <Link
        href={routes.dashboard.organizations.Index}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4'
        )}
      >
        <ChevronLeftIcon className="mr-2 size-4 shrink-0" />
        Back
      </Link>
      <OnboardingWizard
        activeSteps={activeSteps}
        metadata={{}}
        questionnaire={questionnaire}
      />
    </div>
  );
}
