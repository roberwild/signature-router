import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable, organizationTable, membershipTable } from '@workspace/database/schema';
import { eq, and, count } from 'drizzle-orm';
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

export async function DELETE(
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

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all organizations where the user is a member
    const userMemberships = await db
      .select({
        organizationId: membershipTable.organizationId,
        isOwner: membershipTable.isOwner,
        organizationName: organizationTable.name
      })
      .from(membershipTable)
      .innerJoin(organizationTable, eq(membershipTable.organizationId, organizationTable.id))
      .where(eq(membershipTable.userId, id));

    // Find organizations where this user is the sole owner
    const organizationsToDelete: Array<{ id: string; name: string }> = [];
    
    for (const membership of userMemberships) {
      if (membership.isOwner) {
        // Count how many owners this organization has
        const ownerCount = await db
          .select({ count: count() })
          .from(membershipTable)
          .where(
            and(
              eq(membershipTable.organizationId, membership.organizationId),
              eq(membershipTable.isOwner, true)
            )
          );

        // If this user is the sole owner, mark organization for deletion
        if (ownerCount[0]?.count === 1) {
          organizationsToDelete.push({
            id: membership.organizationId,
            name: membership.organizationName
          });
        }
      }
    }

    // Start transaction to delete everything
    await db.transaction(async (tx) => {
      // Delete organizations where the user is the sole owner
      // The CASCADE constraints will handle all related data
      for (const org of organizationsToDelete) {
        await tx
          .delete(organizationTable)
          .where(eq(organizationTable.id, org.id));
      }

      // Delete the user (this will cascade to memberships and other user data)
      await tx
        .delete(userTable)
        .where(eq(userTable.id, id));
    });

    return NextResponse.json({ 
      success: true,
      deletedOrganizations: organizationsToDelete.map(org => org.name),
      message: organizationsToDelete.length > 0 
        ? `User and ${organizationsToDelete.length} organization(s) deleted successfully`
        : 'User deleted successfully (no organizations were deleted as user was not sole owner)'
    });
  } catch (error) {
    console.error('Error deleting user and organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}