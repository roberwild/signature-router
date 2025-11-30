import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { organizationTable,  userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { Session } from 'next-auth';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers and hyphens')
    .optional(),
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

    const organization = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, id))
      .limit(1);

    if (organization.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization[0]);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, id))
      .limit(1);

    if (existingOrg.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if slug is unique when changing it
    if (validatedData.slug && validatedData.slug !== existingOrg[0].slug) {
      const slugExists = await db
        .select()
        .from(organizationTable)
        .where(eq(organizationTable.slug, validatedData.slug))
        .limit(1);

      if (slugExists.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // Update organization
    const updated = await db
      .update(organizationTable)
      .set(validatedData)
      .where(eq(organizationTable.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    // Check if organization exists
    const existingOrg = await db
      .select()
      .from(organizationTable)
      .where(eq(organizationTable.id, id))
      .limit(1);

    if (existingOrg.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete organization (cascades to memberships and other related data)
    await db
      .delete(organizationTable)
      .where(eq(organizationTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}