import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable, membershipTable, organizationTable } from '@workspace/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { Session } from 'next-auth';

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
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

export async function GET(
  _request: NextRequest,
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

    // Get all members of the organization
    const members = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        isOwner: membershipTable.isOwner
      })
      .from(membershipTable)
      .innerJoin(userTable, eq(membershipTable.userId, userTable.id))
      .where(eq(membershipTable.organizationId, id));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: organizationId } = await context.params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = await checkPlatformAdmin(session);
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = addMemberSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1);

    if (existingOrg.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await db
      .select()
      .from(membershipTable)
      .where(
        and(
          eq(membershipTable.organizationId, organizationId),
          eq(membershipTable.userId, userId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({ 
        error: 'User is already a member of this organization' 
      }, { status: 400 });
    }

    // Add the user as a member (not owner)
    const newMembership = await db
      .insert(membershipTable)
      .values({
        organizationId,
        userId,
        isOwner: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `${existingUser[0].name} has been added as a member`,
      membership: newMembership[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error adding member to organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}