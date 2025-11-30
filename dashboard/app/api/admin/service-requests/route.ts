import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable, organizationTable } from '@workspace/database/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
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

    // Get all service requests with organization info
    const requests = await db
      .select({
        id: serviceRequestTable.id,
        organizationId: serviceRequestTable.organizationId,
        organizationName: organizationTable.name,
        contactName: serviceRequestTable.contactName,
        contactEmail: serviceRequestTable.contactEmail,
        contactPhone: serviceRequestTable.contactPhone,
        serviceName: serviceRequestTable.serviceName,
        serviceType: serviceRequestTable.serviceType,
        status: serviceRequestTable.status,
        message: serviceRequestTable.message,
        adminNotes: serviceRequestTable.adminNotes,
        createdAt: serviceRequestTable.createdAt,
        updatedAt: serviceRequestTable.updatedAt,
      })
      .from(serviceRequestTable)
      .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
      .orderBy(desc(serviceRequestTable.updatedAt));

    // Process requests to add unread counts and last messages
    const processedRequests = requests.map(request => {
      let unreadCount = 0;
      let lastMessage = '';
      const hasAttachments = false;

      // Parse messages to get last message and count unreads
      if (request.message) {
        const parts = request.message.split(/--- Mensaje adicional del usuario \((.*?)\) ---/);
        
        // Count user messages after last admin response
        if (request.adminNotes) {
          // Find the timestamp of the last admin response
          const adminParts = request.adminNotes.split(/--- Respuesta del admin \((.*?)\) ---/);
          const lastAdminTimestamp = adminParts.length > 1 
            ? adminParts[adminParts.length - 2] 
            : null;

          if (lastAdminTimestamp) {
            // Count user messages after this timestamp
            for (let i = 1; i < parts.length; i += 2) {
              const userTimestamp = parts[i];
              if (userTimestamp && new Date(userTimestamp) > new Date(lastAdminTimestamp)) {
                unreadCount++;
              }
            }
          }
        } else {
          // No admin response, count all user messages as unread
          unreadCount = Math.ceil(parts.length / 2);
        }
        
        // Get last message (could be from user or admin)
        let lastUserMessage = '';
        let lastUserTime = null;
        
        if (parts.length > 1) {
          const lastContent = parts[parts.length - 1];
          if (lastContent && lastContent.trim()) {
            lastUserMessage = lastContent.trim();
            lastUserTime = parts[parts.length - 2] ? new Date(parts[parts.length - 2]) : null;
          }
        } else if (parts[0] && parts[0].trim()) {
          lastUserMessage = parts[0].trim();
          lastUserTime = new Date(request.createdAt);
        }

        let lastAdminMessage = '';
        let lastAdminTime = null;
        
        if (request.adminNotes) {
          const adminParts = request.adminNotes.split(/--- Respuesta del admin \((.*?)\) ---/);
          if (adminParts.length > 1) {
            const lastContent = adminParts[adminParts.length - 1];
            if (lastContent && lastContent.trim()) {
              lastAdminMessage = lastContent.trim();
              lastAdminTime = adminParts[adminParts.length - 2] 
                ? new Date(adminParts[adminParts.length - 2]) 
                : null;
            }
          }
        }

        // Determine which message is more recent
        if (lastAdminTime && lastUserTime) {
          lastMessage = lastAdminTime > lastUserTime 
            ? lastAdminMessage 
            : lastUserMessage;
        } else if (lastUserMessage) {
          lastMessage = lastUserMessage;
        } else if (lastAdminMessage) {
          lastMessage = lastAdminMessage;
        }

        // Truncate last message
        if (lastMessage.length > 100) {
          lastMessage = lastMessage.substring(0, 100) + '...';
        }
      }

      return {
        ...request,
        unreadCount,
        lastMessage,
        hasAttachments,
      };
    });

    return NextResponse.json(processedRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}