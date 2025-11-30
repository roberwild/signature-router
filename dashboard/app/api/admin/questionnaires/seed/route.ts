import { NextRequest, NextResponse } from 'next/server';
import { db } from '@workspace/database';
import { questionnaireVersionsConfig } from '@workspace/database';
import { eq, and } from 'drizzle-orm';
import { defaultQuestionnaire } from '~/data/lead-qualification/default-questionnaire';

export async function POST(_request: NextRequest) {
  try {
    // Note: This endpoint is for initial setup only
    // In production, you should add proper authentication
    
    // Check if there's already an active onboarding questionnaire
    const existing = await db
      .select()
      .from(questionnaireVersionsConfig)
      .where(
        and(
          eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'),
          eq(questionnaireVersionsConfig.isActive, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        message: 'Active onboarding questionnaire already exists',
        questionnaire: existing[0]
      });
    }

    // Insert the default questionnaire
    const result = await db
      .insert(questionnaireVersionsConfig)
      .values({
        name: 'Evaluación Rápida de Ciberseguridad',
        description: 'Cuestionario principal de onboarding - 6 preguntas para entender las necesidades del lead',
        version: 1,
        isActive: true,
        questionnaireType: 'onboarding',
        questions: defaultQuestionnaire.questions,
        scoringConfig: defaultQuestionnaire.scoring,
        uiConfig: defaultQuestionnaire.ui
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Successfully created onboarding questionnaire',
      questionnaire: result[0]
    });
    
  } catch (error) {
    console.error('Error seeding onboarding questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to seed questionnaire' },
      { status: 500 }
    );
  }
}