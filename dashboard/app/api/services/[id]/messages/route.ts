import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Get the service request
    const [request] = await db
      .select({
        id: serviceRequestTable.id,
        message: serviceRequestTable.message,
        adminNotes: serviceRequestTable.adminNotes,
        userId: serviceRequestTable.userId,
        createdAt: serviceRequestTable.createdAt,
        updatedAt: serviceRequestTable.updatedAt,
        contactName: serviceRequestTable.contactName,
      })
      .from(serviceRequestTable)
      .where(eq(serviceRequestTable.id, id))
      .limit(1);

    if (!request) {
      return new NextResponse('Service request not found', { status: 404 });
    }

    // Check if user is platform admin or owns this request
    const user = await db.query.userTable.findFirst({
      where: (users, { eq }) => eq(users.id, session.user?.id || ''),
      columns: {
        isPlatformAdmin: true,
      },
    });

    const isAdmin = user?.isPlatformAdmin || false;
    const isOwner = request.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Parse messages
    const messages: Array<{
      type: 'user' | 'admin',
      content: string,
      timestamp: string,
      label: string
    }> = [];

    // Parse user messages
    if (request.message) {
      const parts = request.message.split(/--- Mensaje adicional del usuario \((.*?)\) ---/);
      
      if (parts[0] && parts[0].trim()) {
        messages.push({
          type: 'user',
          content: parts[0].trim(),
          timestamp: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
          label: 'Mensaje original'
        });
      }
      
      for (let i = 1; i < parts.length; i += 2) {
        const timestamp = parts[i];
        const content = parts[i + 1];
        
        if (content && content.trim()) {
          messages.push({
            type: 'user',
            content: content.trim(),
            timestamp: timestamp || (request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt),
            label: 'Mensaje adicional'
          });
        }
      }
    }
    
    // Parse admin messages
    if (request.adminNotes) {
      if (request.adminNotes.includes('--- Respuesta del admin')) {
        const adminParts = request.adminNotes.split(/--- Respuesta del admin \((.*?)\) ---/);
        
        for (let i = 1; i < adminParts.length; i += 2) {
          const timestamp = adminParts[i];
          const content = adminParts[i + 1];
          
          if (content && content.trim()) {
            messages.push({
              type: 'admin',
              content: content.trim(),
              timestamp: timestamp || (request.updatedAt instanceof Date ? request.updatedAt.toISOString() : request.updatedAt),
              label: 'Respuesta del equipo'
            });
          }
        }
      } else {
        messages.push({
          type: 'admin',
          content: request.adminNotes,
          timestamp: request.createdAt instanceof Date ? request.createdAt.toISOString() : request.createdAt,
          label: 'Respuesta del equipo'
        });
      }
    }
    
    // Sort messages by timestamp
    messages.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });

    return NextResponse.json({
      messages,
      lastUpdated: request.updatedAt,
      contactName: request.contactName
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}