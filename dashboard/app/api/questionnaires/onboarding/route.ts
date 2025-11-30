import { NextRequest, NextResponse } from 'next/server';
import { db } from '@workspace/database';
import { questionnaireVersionsConfig } from '@workspace/database';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthContext } from '@workspace/auth/context';

// GET the active onboarding questionnaire
export async function GET(_request: NextRequest) {
  try {
    // Get the active onboarding questionnaire
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
      // Return the default questionnaire structure if none exists
      return NextResponse.json({
        error: 'No active questionnaire found',
        defaultAvailable: true
      }, { status: 404 });
    }

    const questionnaire = activeQuestionnaire[0];
    
    // Transform the database format to match the expected format
    return NextResponse.json({
      version: questionnaire.version,
      questions: questionnaire.questions,
      scoring: questionnaire.scoringConfig,
      ui: questionnaire.uiConfig,
      metadata: {
        id: questionnaire.id,
        name: questionnaire.name,
        description: questionnaire.description,
        createdAt: questionnaire.createdAt,
        updatedAt: questionnaire.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching onboarding questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
}

// PUT to update the onboarding questionnaire (admin only)
export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    
    // Check if user is admin (you may want to implement proper permission checking)
    // For now, we'll just check if user is authenticated
    if (!ctx.session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questions, scoring, ui, name, description } = body;

    // Deactivate current active questionnaire
    await db
      .update(questionnaireVersionsConfig)
      .set({ isActive: false })
      .where(
        and(
          eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'),
          eq(questionnaireVersionsConfig.isActive, true)
        )
      );

    // Get the latest version number
    const latestVersion = await db
      .select({ version: questionnaireVersionsConfig.version })
      .from(questionnaireVersionsConfig)
      .where(eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'))
      .orderBy(desc(questionnaireVersionsConfig.version))
      .limit(1);

    const newVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

    // Create new version
    const newQuestionnaire = await db
      .insert(questionnaireVersionsConfig)
      .values({
        name: name || 'Evaluación Rápida de Ciberseguridad',
        description: description || 'Cuestionario principal de onboarding',
        version: newVersion,
        isActive: true,
        questionnaireType: 'onboarding',
        questions: questions,
        scoringConfig: scoring,
        uiConfig: ui,
        createdBy: ctx.session.user?.id || ''
      })
      .returning();

    return NextResponse.json({
      success: true,
      questionnaire: newQuestionnaire[0]
    });
  } catch (error) {
    console.error('Error updating onboarding questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to update questionnaire' },
      { status: 500 }
    );
  }
}

// POST to create a new version from existing (clone)
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    
    if (!ctx.session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { baseVersionId, name, description } = body;

    // Get the base version to clone from
    let baseVersion;
    if (baseVersionId) {
      const result = await db
        .select()
        .from(questionnaireVersionsConfig)
        .where(eq(questionnaireVersionsConfig.id, baseVersionId))
        .limit(1);
      
      if (result.length === 0) {
        return NextResponse.json(
          { error: 'Base version not found' },
          { status: 404 }
        );
      }
      baseVersion = result[0];
    } else {
      // Get current active version
      const result = await db
        .select()
        .from(questionnaireVersionsConfig)
        .where(
          and(
            eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'),
            eq(questionnaireVersionsConfig.isActive, true)
          )
        )
        .limit(1);
      
      if (result.length === 0) {
        return NextResponse.json(
          { error: 'No active version to clone from' },
          { status: 404 }
        );
      }
      baseVersion = result[0];
    }

    // Get the latest version number
    const latestVersion = await db
      .select({ version: questionnaireVersionsConfig.version })
      .from(questionnaireVersionsConfig)
      .where(eq(questionnaireVersionsConfig.questionnaireType, 'onboarding'))
      .orderBy(desc(questionnaireVersionsConfig.version))
      .limit(1);

    const newVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

    // Create new version (not active by default)
    const newQuestionnaire = await db
      .insert(questionnaireVersionsConfig)
      .values({
        name: name || `${baseVersion.name} (v${newVersion})`,
        description: description || baseVersion.description,
        version: newVersion,
        isActive: false, // New versions are not active by default
        questionnaireType: 'onboarding',
        questions: baseVersion.questions,
        scoringConfig: baseVersion.scoringConfig,
        uiConfig: baseVersion.uiConfig,
        createdBy: ctx.session.user?.id || ''
      })
      .returning();

    return NextResponse.json({
      success: true,
      questionnaire: newQuestionnaire[0]
    });
  } catch (error) {
    console.error('Error creating questionnaire version:', error);
    return NextResponse.json(
      { error: 'Failed to create questionnaire version' },
      { status: 500 }
    );
  }
}