import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable, ServiceRequestStatus } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const { status }: { status: string } = await req.json();

    // Validate status
    const validStatuses = ['pending', 'contacted', 'in-progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
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

    // Check if the service request exists
    const [request] = await db
      .select({
        id: serviceRequestTable.id,
      })
      .from(serviceRequestTable)
      .where(eq(serviceRequestTable.id, id))
      .limit(1);

    if (!request) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    // Update the status
    await db
      .update(serviceRequestTable)
      .set({
        status: status as ServiceRequestStatus,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequestTable.id, id));

    return NextResponse.json({
      success: true,
      status,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}