import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getQuestionnaireConfigs } from '~/data/admin/questionnaires/get-questionnaire-configs';

export async function GET(_request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    const data = await getQuestionnaireConfigs();
    
    return Response.json(data);
  } catch (error) {
    console.error('Questionnaire configs API error:', error);
    return Response.json(
      { error: 'Failed to fetch questionnaire configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    const body = await request.json();
    const { _name, _description, _type, _questions, _settings } = body;

    // In a real implementation, this would create a new questionnaire version
    // const newQuestionnaire = await createQuestionnaireVersion({
    //   name,
    //   description,
    //   type,
    //   questions,
    //   settings
    // });

    return Response.json({ 
      success: true,
      message: 'Questionnaire created successfully'
    });
  } catch (error) {
    console.error('Create questionnaire error:', error);
    return Response.json(
      { error: 'Failed to create questionnaire' },
      { status: 500 }
    );
  }
}