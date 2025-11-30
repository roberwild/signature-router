import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is platform admin
    const user = await db.query.userTable.findFirst({
      where: (users, { eq }) => eq(users.id, session.user?.id || ''),
      columns: {
        isPlatformAdmin: true,
      },
    });

    if (!user?.isPlatformAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse('Status is required', { status: 400 });
    }

    // Validate status value
    const validStatuses = ['pending', 'contacted', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return new NextResponse('Invalid status value', { status: 400 });
    }

    // Update the service request status
    const [updated] = await db
      .update(serviceRequestTable)
      .set({ 
        status,
        updatedAt: new Date() 
      })
      .where(eq(serviceRequestTable.id, params.id))
      .returning();

    if (!updated) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating service request status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}