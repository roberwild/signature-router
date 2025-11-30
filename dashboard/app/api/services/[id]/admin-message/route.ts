import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable, ServiceRequestStatus } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return new NextResponse('Invalid message', { status: 400 });
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

    // Get the current service request
    const [request] = await db
      .select({
        id: serviceRequestTable.id,
        adminNotes: serviceRequestTable.adminNotes,
        status: serviceRequestTable.status,
      })
      .from(serviceRequestTable)
      .where(eq(serviceRequestTable.id, id))
      .limit(1);

    if (!request) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    // Format the new admin message with timestamp
    const timestamp = new Date().toISOString();
    const formattedMessage = `--- Respuesta del admin (${timestamp}) ---\n${message}\n`;

    // Append to existing admin notes or create new
    const updatedAdminNotes = request.adminNotes 
      ? request.adminNotes + '\n' + formattedMessage
      : formattedMessage;

    // Update the service request with new admin notes
    // Also update status to 'contacted' if it was 'pending'
    const newStatus = request.status === ServiceRequestStatus.PENDING ? ServiceRequestStatus.CONTACTED : request.status;

    await db
      .update(serviceRequestTable)
      .set({
        adminNotes: updatedAdminNotes,
        status: newStatus as ServiceRequestStatus,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequestTable.id, id));

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      timestamp,
    });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}