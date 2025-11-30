import * as React from 'react';
import { OnboardingLeadQualificationStep } from './onboarding-lead-qualification-step';
import { getActiveOnboardingQuestionnaire } from '~/data/questionnaires/get-active-onboarding';
import type { OnboardingStepProps } from './onboarding-step-props';

export async function OnboardingLeadQualificationStepWrapper(props: OnboardingStepProps) {
  // Fetch the active questionnaire from the database
  const questionnaire = await getActiveOnboardingQuestionnaire();
  
  return (
    <OnboardingLeadQualificationStep 
      {...props} 
      questionnaire={questionnaire}
    />
  );
}