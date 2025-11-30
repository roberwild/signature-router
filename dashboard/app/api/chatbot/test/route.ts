import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';

// Interface for error handling
interface ChatbotError extends Error {
  name: string;
  message: string;
  response?: { data?: unknown };
}

export async function GET(_request: NextRequest) {
  try {
    console.log('Testing OpenAI API...');
    
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: false,
      maxTokens: 100,
    });

    const response = await model.invoke('Say "Hello, the API is working!" in Spanish.');
    
    return NextResponse.json({
      success: true,
      response: response.content.toString(),
      model: 'ChatOpenAI',
    });
  } catch (error: unknown) {
    console.error('OpenAI API Test Error:', error);
    const typedError = error as ChatbotError;
    return NextResponse.json(
      {
        success: false,
        error: typedError.message || 'Unknown error',
        details: typedError.response?.data || typedError
      },
      { status: 500 }
    );
  }
}