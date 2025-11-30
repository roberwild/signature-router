import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable, membershipTable } from '@workspace/database/schema';
import { eq, not, inArray } from 'drizzle-orm';
import { Session } from 'next-auth';

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
    const { id: organizationId } = await context.params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = await checkPlatformAdmin(session);
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all current members of the organization
    const currentMembers = await db
      .select({
        userId: membershipTable.userId
      })
      .from(membershipTable)
      .where(eq(membershipTable.organizationId, organizationId));

    const memberIds = currentMembers.map(m => m.userId);

    // Get all users who are NOT members of this organization
    let availableUsersQuery;
    
    if (memberIds.length > 0) {
      // If there are members, exclude them
      availableUsersQuery = db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email
        })
        .from(userTable)
        .where(not(inArray(userTable.id, memberIds)))
        .orderBy(userTable.name);
    } else {
      // If no members exist (new org), get all users
      availableUsersQuery = db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email
        })
        .from(userTable)
        .orderBy(userTable.name);
    }

    const availableUsers = await availableUsersQuery;

    return NextResponse.json(availableUsers);
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}