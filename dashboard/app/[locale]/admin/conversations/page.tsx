import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable, organizationTable } from '@workspace/database/schema';
import { desc, eq } from 'drizzle-orm';
import { ConversationsManager } from '~/components/admin/conversations/conversations-manager';

interface ServiceRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  serviceName: string;
  serviceType?: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  message?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  lastMessage?: string;
  hasAttachments?: boolean;
}

export const metadata: Metadata = {
  title: 'Conversaciones | Admin',
  description: 'Gestiona todas las conversaciones de soporte en un solo lugar',
};

export default async function AdminConversationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const userId = session.user.id;

  // Check if user is platform admin
  const user = await db.query.userTable.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    columns: {
      isPlatformAdmin: true,
    },
  });

  if (!user?.isPlatformAdmin) {
    redirect('/');
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
      
      // Count user messages as unread if no admin response
      if (!request.adminNotes || request.adminNotes === '') {
        unreadCount = Math.ceil(parts.length / 2);
      }
      
      // Get last message
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.trim()) {
        lastMessage = lastPart.trim().substring(0, 100) + (lastPart.length > 100 ? '...' : '');
      }
    }

    return {
      ...request,
      organizationName: request.organizationName || 'Sin organización',
      contactPhone: request.contactPhone || undefined,
      serviceType: request.serviceType || undefined,
      message: request.message || undefined,
      adminNotes: request.adminNotes || undefined,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      unreadCount,
      lastMessage,
      hasAttachments,
    };
  });

  return (
    <ConversationsManager
      initialRequests={processedRequests as ServiceRequest[]}
      currentUserId={session.user.id}
    />
  );
}