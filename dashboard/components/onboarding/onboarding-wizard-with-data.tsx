import * as React from 'react';
import { OnboardingWizard, type OnboardingWizardProps } from './onboarding-wizard';
import { getActiveOnboardingQuestionnaire } from '~/data/questionnaires/get-active-onboarding';

export async function OnboardingWizardWithData(props: OnboardingWizardProps) {
  const questionnaire = await getActiveOnboardingQuestionnaire();
  
  return (
    <OnboardingWizard 
      {...props} 
      questionnaire={questionnaire}
    />
  );
}