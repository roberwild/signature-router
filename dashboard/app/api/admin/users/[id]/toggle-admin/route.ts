import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Session } from 'next-auth';

const toggleAdminSchema = z.object({
  isPlatformAdmin: z.boolean(),
});

async function checkPlatformAdmin(session: Session | null) {
  if (!session?.user?.id) {
    return false;
  }

  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  return user[0]?.isPlatformAdmin === true;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await context.params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = await checkPlatformAdmin(session);
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent self-modification
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = toggleAdminSchema.parse(body);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update admin status
    const updated = await db
      .update(userTable)
      .set({
        isPlatformAdmin: validatedData.isPlatformAdmin,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      isPlatformAdmin: updated[0].isPlatformAdmin,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error toggling admin status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}