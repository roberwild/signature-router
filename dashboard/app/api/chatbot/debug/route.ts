import { NextRequest, NextResponse } from 'next/server';
import { generateSystemPrompt, getServices, getClientProfile, getCISAssessment, getSelfEvaluation, type ChatbotContext } from '~/lib/chatbot/chatbot-context-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId,
      organizationName,
      organizationSlug,
      userId,
      userName,
      userEmail
    } = await request.json();

    // Build chatbot context (same as main chatbot)
    const context: ChatbotContext = {
      organization: {
        id: organizationId || 'unknown',
        name: organizationName || 'Tu Organización',
        slug: organizationSlug || 'org'
      },
      user: {
        id: userId || 'unknown',
        name: userName || 'Cliente',
        email: userEmail || 'user@example.com'
      },
      services: await getServices()
    };

    // Fetch client profile if available
    if (organizationId && userEmail) {
      const profile = await getClientProfile(organizationId, userEmail);
      if (profile) {
        context.clientProfile = profile;
      }
    }
    
    // Fetch CIS assessment if available
    if (organizationId) {
      const assessment = await getCISAssessment(organizationId);
      if (assessment) {
        context.cisAssessment = assessment;
      }
      
      // Fetch self-evaluation (autoevaluación)
      const selfEval = await getSelfEvaluation(organizationId);
      if (selfEval) {
        context.selfEvaluation = selfEval;
      }
    }

    // Generate the system prompt
    const systemPrompt = await generateSystemPrompt(context);

    // Also return debug info about what was found
    const debugInfo = {
      organizationProvided: !!organizationName,
      organizationName: organizationName || 'NOT PROVIDED',
      userProvided: !!userName,
      userName: userName || 'NOT PROVIDED',
      profileFound: !!context.clientProfile,
      hasResponses: !!(context.clientProfile?.responses && Object.keys(context.clientProfile.responses).length > 0),
      cisAssessmentFound: !!context.cisAssessment,
      cisAssessmentDate: context.cisAssessment?.assessmentDate,
      cisAssessmentScore: context.cisAssessment?.totalScore,
      servicesCount: context.services.length
    };

    return NextResponse.json({
      systemPrompt,
      debugInfo
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate debug info' },
      { status: 500 }
    );
  }
}