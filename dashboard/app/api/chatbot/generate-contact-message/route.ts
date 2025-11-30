import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';

interface ContactMessageRequest {
  organizationName: string;
  userName: string;
  userEmail: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  messageType: 'whatsapp' | 'email' | 'phone';
  useFirstPerson?: boolean;
}

const CONTACT_MESSAGE_TEMPLATE = `🤖 *FUENTE: Minery Guard Platform*

Hola, soy {userName} de {organizationName}.

📋 *DATOS DE CONTACTO:*
• Organización: {organizationName}
• Nombre: {userName}
• Email: {userEmail}

💬 *CONSULTA REALIZADA:*
{conversationSummary}

📝 *RECOMENDACIÓN DEL ASESOR:*
{assistantRecommendation}

❓ ¿Podrían ayudarme con más información sobre estos servicios?

Gracias.`;

const CONVERSATION_ANALYSIS_PROMPT = `Eres un asistente que analiza conversaciones de clientes con un chatbot de ciberseguridad para crear resúmenes para el equipo de ventas.

INSTRUCCIONES:
1. Analiza la conversación del cliente con el asesor de ciberseguridad
2. Identifica los principales temas, preocupaciones y necesidades del cliente
3. Resume las recomendaciones más importantes del asesor
4. Mantén un tono profesional y conciso
5. Enfócate en información relevante para ventas

CONVERSACIÓN A ANALIZAR:
{conversation}

TAREAS:
1. RESUMEN DE CONSULTAS: Crea un resumen en español de las principales preguntas y preocupaciones del cliente (máximo 200 palabras). Usa viñetas y sé específico sobre los servicios mencionados. IMPORTANTE: Si el parámetro useFirstPerson es true, escribe en primera persona desde la perspectiva del cliente (ej: "Necesito saber..." en lugar de "El cliente pregunta...").

2. RECOMENDACIONES DEL ASESOR: Resume las principales recomendaciones del asesor (máximo 150 palabras). Menciona servicios específicos recomendados.

FORMATO DE RESPUESTA (JSON):
{
  "conversationSummary": "• [Consulta 1]\\n• [Consulta 2]\\n• [Consulta 3]",
  "assistantRecommendation": "Resumen de las recomendaciones del asesor..."
}`;

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationName,
      userName,
      userEmail,
      messages,
      messageType,
      useFirstPerson = false
    }: ContactMessageRequest = await request.json();

    // Prepare conversation text for analysis
    const conversationText = messages
      .slice(-8) // Last 8 messages for context
      .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Asesor'}: ${msg.content}`)
      .join('\n\n');

    // Initialize LLM
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent output
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxTokens: 500,
    });

    // Generate conversation analysis
    const analysisPrompt = CONVERSATION_ANALYSIS_PROMPT
      .replace('{conversation}', conversationText)
      + (useFirstPerson ? '\n\nMUY IMPORTANTE: Escribe el resumen de consultas en PRIMERA PERSONA desde la perspectiva del cliente. Usa frases como "Necesito...", "Quiero saber...", "Me preocupa...", "He consultado sobre..." en lugar de "El cliente pregunta..." o "El usuario necesita...".' : '');

    console.log('🔍 Analyzing conversation for contact message generation...');
    
    const analysisResponse = await model.invoke(analysisPrompt);
    const analysisText = analysisResponse.content.toString();

    // Try to parse JSON response from LLM
    let analysis;
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM analysis response:', parseError);
      // Fallback: create basic analysis
      analysis = {
        conversationSummary: "El cliente consultó sobre servicios de ciberseguridad específicos para su organización.",
        assistantRecommendation: "Se recomendaron servicios adaptados a las necesidades identificadas."
      };
    }

    // Fill the template with the analyzed information
    let finalMessage = CONTACT_MESSAGE_TEMPLATE
      .replace(/\{organizationName\}/g, organizationName || 'No especificada')
      .replace(/\{userName\}/g, userName || 'No especificado')
      .replace(/\{userEmail\}/g, userEmail || 'No especificado')
      .replace('{conversationSummary}', analysis.conversationSummary || 'Consulta sobre servicios de ciberseguridad')
      .replace('{assistantRecommendation}', analysis.assistantRecommendation || 'Se proporcionaron recomendaciones específicas');

    // Adjust formatting based on message type
    if (messageType === 'email') {
      // Remove WhatsApp markdown formatting for email
      finalMessage = finalMessage.replace(/\*/g, '');
    } else if (messageType === 'phone') {
      // For phone calls, we don't need the full template - just return analysis
      // The phone modal will format it appropriately
      console.log('✅ Phone talking points generated successfully');
      return NextResponse.json({
        message: finalMessage, // Keep full template for fallback
        analysis: analysis,
        success: true
      });
    }

    console.log('✅ Contact message generated successfully');

    return NextResponse.json({
      message: finalMessage,
      analysis: analysis,
      success: true
    });

  } catch (error) {
    console.error('Error generating contact message:', error);
    
    // Return fallback message on error
    const fallbackMessage = `🤖 FUENTE: Minery Guard Platform

Hola, soy un cliente interesado en sus servicios de ciberseguridad.

He estado consultando con su asesor virtual y me gustaría obtener más información personalizada sobre sus soluciones.

¿Podrían contactarme para discutir mis necesidades específicas?

Gracias.`;

    return NextResponse.json({
      message: fallbackMessage,
      analysis: null,
      success: false,
      error: 'Failed to generate personalized message, using fallback'
    });
  }
}