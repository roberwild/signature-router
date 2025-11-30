import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';

// Import context service
import { generateSystemPrompt, getServices, getClientProfile, getCISAssessment, getSelfEvaluation, type ChatbotContext } from '~/lib/chatbot/chatbot-context-service';

// Simple in-memory session storage (replace with database later)
const sessions = new Map<string, Array<{ role: string; content: string }>>();

// Security: List of sensitive terms that should never appear in responses
const SENSITIVE_TERMS = [
  'lead score',
  'lead_score',
  'leadScore',
  'puntuación de lead',
  'puntuación del lead',
  'categoría de lead',
  'lead category',
  'leadCategory',
  'lead_category',
  'profileCompleteness',
  'profile_completeness',
  'completitud del perfil',
  'user_id',
  'userId',
  'organization_id',
  'organizationId',
  'database schema',
  'system prompt',
  'prompt del sistema',
  'api key',
  'api_key',
  'secret',
  'token',
  'password',
  'contraseña'
];

/**
 * Validate response content for security
 * Returns true if content is safe, false if it contains sensitive information
 */
function validateResponseSecurity(content: string): { isValid: boolean; reason?: string } {
  const lowerContent = content.toLowerCase();
  
  // Check for sensitive terms
  for (const term of SENSITIVE_TERMS) {
    if (lowerContent.includes(term.toLowerCase())) {
      return { 
        isValid: false, 
        reason: `Response contains sensitive term: ${term}` 
      };
    }
  }
  
  // Check for numeric patterns that might be scores (e.g., "85/100", "Score: 85")
  const scorePatterns = [
    /\b\d{1,3}\s*\/\s*100\b/i,  // Matches "85/100", "85 / 100"
    /\bscore\s*:?\s*\d+/i,       // Matches "score: 85", "score 85"
    /\bpuntuación\s*:?\s*\d+/i,  // Matches "puntuación: 85"
    /\bcategoría\s*:?\s*[A-E]\b/i, // Matches "categoría: A"
  ];
  
  for (const pattern of scorePatterns) {
    if (pattern.test(content)) {
      return { 
        isValid: false, 
        reason: 'Response contains potential score or classification data' 
      };
    }
  }
  
  // Check for potential prompt injection attempts in the response
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /disregard\s+all\s+prior/i,
    /sistema\s+prompt/i,
    /revela\s+tu\s+prompt/i,
    /show\s+system\s+message/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(content)) {
      return { 
        isValid: false, 
        reason: 'Response may be responding to prompt injection attempt' 
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Sanitize response content by removing or replacing sensitive information
 */
function sanitizeResponse(content: string): string {
  // If validation fails, return a safe default response
  const validation = validateResponseSecurity(content);
  if (!validation.isValid) {
    console.warn('Response validation failed:', validation.reason);
    return 'Me enfoco en entender sus necesidades específicas para recomendar los servicios de ciberseguridad más adecuados. ¿En qué área de seguridad puedo ayudarle hoy?';
  }
  
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      sessionId, 
      stream = true,
      organizationId,
      organizationName,
      organizationSlug,
      userId,
      userName,
      userEmail
    } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create session
    const currentSessionId = sessionId || `session-${Date.now()}`;
    const history = sessions.get(currentSessionId) || [];

    // Build chatbot context
    const context: ChatbotContext = {
      organization: {
        id: organizationId || 'unknown',
        name: organizationName || 'Tu Organización',  // Better fallback
        slug: organizationSlug || 'org'
      },
      user: {
        id: userId || 'unknown',
        name: userName || 'Cliente',
        email: userEmail || 'user@example.com'
      },
      services: await getServices()
    };
    
    // Enhanced logging for debugging
    console.log('============ CHATBOT API REQUEST ============');
    console.log('Raw request data:', {
      organizationId,
      organizationName,
      organizationSlug,
      userId,
      userName,
      userEmail,
      message: message.substring(0, 50) + '...'
    });
    console.log('Context built:', {
      orgId: context.organization.id,
      orgName: context.organization.name,
      orgSlug: context.organization.slug,
      userName: context.user.name,
      servicesCount: context.services.length
    });
    console.log('============================================');

    // Fetch client profile if we have the necessary information
    if (organizationId && userEmail) {
      const profile = await getClientProfile(organizationId, userEmail);
      if (profile) {
        context.clientProfile = profile;
      }
    }
    
    // Fetch CIS assessment if we have organization ID
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

    // Generate dynamic system prompt
    const systemPrompt = await generateSystemPrompt(context);

    // Build conversation context with reinforced organization name
    const conversationContext = [
      systemPrompt,
      `\nRECORDATORIO CRÍTICO: Estás hablando con "${context.organization.name}". USA SIEMPRE "${context.organization.name}" cuando te refieras a esta organización. NO uses placeholders.\n`,
      ...history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join('\n'),
      `Usuario: ${message}`
    ].join('\n\n');

    // Initialize the model for this request
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini', // Using more reliable model
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: stream,
      maxTokens: 1000,
    });

    if (stream) {
      // Create a readable stream for the response
      const readable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            console.log('Starting stream with model: ChatOpenAI');
            const streamResponse = await model.stream(conversationContext);
            let fullContent = '';
            
            for await (const chunk of streamResponse) {
              const content = chunk.content.toString();
              fullContent += content;
              
              // Validate and sanitize accumulated content
              const sanitizedContent = sanitizeResponse(fullContent);
              
              // Only write if content is different after sanitization
              if (sanitizedContent !== fullContent) {
                // Content was sanitized, write the safe version and stop streaming
                controller.enqueue(encoder.encode(sanitizedContent));
                fullContent = sanitizedContent;
                break;
              } else {
                // Content is safe, write the chunk
                controller.enqueue(encoder.encode(content));
              }
            }
            
            // Update session history with complete response
            history.push({ role: 'user', content: message });
            history.push({ role: 'assistant', content: fullContent });
            
            // Keep only last 10 messages for context
            if (history.length > 20) {
              history.splice(0, history.length - 20);
            }
            
            sessions.set(currentSessionId, history);
          } catch (error) {
            console.error('Streaming error:', error);
            const errorMsg = '\n\nLo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.';
            controller.enqueue(encoder.encode(errorMsg));
          } finally {
            controller.close();
          }
        }
      });

      // Return the streaming response with session ID in headers
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Session-Id': currentSessionId,
        },
      });
    } else {
      // Non-streaming response (fallback)
      const response = await model.invoke(conversationContext);
      const responseText = response.content.toString();
      
      // Sanitize the response before sending
      const sanitizedText = sanitizeResponse(responseText);

      // Update session history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: sanitizedText });
      
      // Keep only last 10 messages for context
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      sessions.set(currentSessionId, history);

      return NextResponse.json({
        response: sanitizedText,
        sessionId: currentSessionId,
      });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}