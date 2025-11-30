import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable, membershipTable, organizationTable } from '@workspace/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { Session } from 'next-auth';

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner ID is required'),
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
    const { id: organizationId } = await context.params;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = await checkPlatformAdmin(session);
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { newOwnerId } = transferOwnershipSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, organizationId))
      .limit(1);

    if (existingOrg.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the new owner is a member of the organization
    const newOwnerMembership = await db
      .select()
      .from(membershipTable)
      .where(
        and(
          eq(membershipTable.organizationId, organizationId),
          eq(membershipTable.userId, newOwnerId)
        )
      )
      .limit(1);

    if (newOwnerMembership.length === 0) {
      return NextResponse.json({ 
        error: 'User is not a member of this organization' 
      }, { status: 400 });
    }

    // Check if the new owner already owns the organization
    if (newOwnerMembership[0].isOwner) {
      return NextResponse.json({ 
        error: 'User is already the owner of this organization' 
      }, { status: 400 });
    }

    // Transfer ownership in a transaction
    await db.transaction(async (tx) => {
      // Remove ownership from current owner(s)
      await tx
        .update(membershipTable)
        .set({ isOwner: false })
        .where(
          and(
            eq(membershipTable.organizationId, organizationId),
            eq(membershipTable.isOwner, true)
          )
        );

      // Grant ownership to new owner
      await tx
        .update(membershipTable)
        .set({ isOwner: true })
        .where(
          and(
            eq(membershipTable.organizationId, organizationId),
            eq(membershipTable.userId, newOwnerId)
          )
        );
    });

    // Get the new owner's details for response
    const newOwner = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email
      })
      .from(userTable)
      .where(eq(userTable.id, newOwnerId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: `Ownership transferred successfully to ${newOwner[0]?.name}`,
      newOwner: newOwner[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error transferring ownership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}