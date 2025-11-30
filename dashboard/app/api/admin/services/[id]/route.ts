import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
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

    // Delete the service request
    const [deleted] = await db
      .delete(serviceRequestTable)
      .where(eq(serviceRequestTable.id, params.id))
      .returning();

    if (!deleted) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Service request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting service request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}