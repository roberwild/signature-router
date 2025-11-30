import { NextRequest, NextResponse } from 'next/server';
import { db, conversations,  eq, and, inArray } from '@workspace/database';
import { auth } from '@workspace/auth';

export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationIds, deleteAll } = body;

    if (deleteAll) {
      // Delete all conversations for the user
      await db
        .delete(conversations)
        .where(eq(conversations.userId, session.user?.id || ''));
      
      return NextResponse.json({ 
        success: true, 
        message: 'All conversations deleted successfully' 
      });
    } else if (conversationIds && Array.isArray(conversationIds)) {
      // Delete specific conversations
      await db
        .delete(conversations)
        .where(
          and(
            inArray(conversations.id, conversationIds),
            eq(conversations.userId, session.user?.id || '')
          )
        );
      
      return NextResponse.json({ 
        success: true, 
        message: `${conversationIds.length} conversations deleted successfully` 
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid request. Provide conversationIds array or set deleteAll to true' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}