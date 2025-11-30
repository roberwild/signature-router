import { db } from '@workspace/database';
import { questionnaireVersionsConfig } from '@workspace/database';
import { eq, and } from 'drizzle-orm';
import { cache } from 'react';
import { defaultQuestionnaire, type QuestionnaireConfig } from '~/data/lead-qualification/default-questionnaire';

export const getActiveOnboardingQuestionnaire = cache(async () => {
  try {
    // Get the active onboarding questionnaire from database
    const activeQuestionnaire = await db
      .select()
      .from(questionnaireVersionsConfig)
      .where(
        and(
          eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'),
          eq(questionnaireVersionsConfig.isActive, true)
        )
      )
      .limit(1);

    if (activeQuestionnaire.length === 0) {
      // Return the default questionnaire if none exists in database
      console.log('No active questionnaire in database, using default');
      return defaultQuestionnaire;
    }

    const questionnaire = activeQuestionnaire[0];
    
    // Transform the database format to match the expected format
    return {
      version: questionnaire.version,
      questions: questionnaire.questions as QuestionnaireConfig['questions'], // Type assertion to proper type
      scoring: questionnaire.scoringConfig || defaultQuestionnaire.scoring,
      ui: questionnaire.uiConfig || defaultQuestionnaire.ui,
      extended_questionnaires: defaultQuestionnaire.extended_questionnaires // Keep the extended ones for now
    } as QuestionnaireConfig;
  } catch (error) {
    console.error('Error fetching onboarding questionnaire:', error);
    // Fallback to default questionnaire on error
    return defaultQuestionnaire;
  }
});