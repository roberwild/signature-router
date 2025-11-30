import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { serviceRequestTable, organizationTable, userTable } from '@workspace/database/schema';
import { eq, desc, or, isNotNull } from 'drizzle-orm';
import { ChatInterface, SelectedChatData } from '../components/chat-interface';

export const metadata: Metadata = {
  title: 'Service Messages | Admin Panel',
  description: 'Manage service request conversations',
};

interface AdminChatPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    id?: string;
  };
}

// Get all service requests with message activity
async function getServiceRequestChats() {
  const requests = await db
    .select({
      id: serviceRequestTable.id,
      serviceName: serviceRequestTable.serviceName,
      serviceType: serviceRequestTable.serviceType,
      status: serviceRequestTable.status,
      message: serviceRequestTable.message,
      adminNotes: serviceRequestTable.adminNotes,
      contactName: serviceRequestTable.contactName,
      contactEmail: serviceRequestTable.contactEmail,
      contactPhone: serviceRequestTable.contactPhone,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
      userId: serviceRequestTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
      createdAt: serviceRequestTable.createdAt,
      updatedAt: serviceRequestTable.updatedAt,
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
    .where(
      or(
        isNotNull(serviceRequestTable.message),
        isNotNull(serviceRequestTable.adminNotes)
      )
    )
    .orderBy(desc(serviceRequestTable.updatedAt));

  // Process requests to add unread count and last message info
  return requests.map(request => {
    let messageCount = 0;
    let unreadCount = 0;
    let lastMessage = '';
    const _lastMessageTime = request.createdAt;
    let lastMessageType: 'user' | 'admin' = 'user';

    // Parse messages to get counts and last message
    if (request.message) {
      const userMessages = request.message.split('--- Mensaje adicional del usuario').length;
      messageCount += userMessages;
      lastMessage = request.message.split('--- Mensaje adicional del usuario').pop()?.trim() || request.message;
      lastMessageType = 'user';
    }

    if (request.adminNotes) {
      const adminMessages = request.adminNotes.split('--- Respuesta del admin').length;
      messageCount += adminMessages;
      // Check if admin message is more recent
      const adminParts = request.adminNotes.split('--- Respuesta del admin');
      if (adminParts.length > 1) {
        lastMessage = adminParts[adminParts.length - 1].trim();
        lastMessageType = 'admin';
      }
    }

    // Calculate unread (pending status = unread messages)
    if (request.status === 'pending') {
      unreadCount = 1; // At least one unread
    }

    return {
      ...request,
      messageCount,
      unreadCount,
      lastMessage: lastMessage.length > 100 ? lastMessage.substring(0, 100) + '...' : lastMessage,
      lastMessageTime: request.updatedAt,
      lastMessageType,
    };
  });
}

// Get single service request details
async function getServiceRequestDetail(id: string) {
  const [request] = await db
    .select({
      id: serviceRequestTable.id,
      serviceName: serviceRequestTable.serviceName,
      serviceType: serviceRequestTable.serviceType,
      status: serviceRequestTable.status,
      message: serviceRequestTable.message,
      adminNotes: serviceRequestTable.adminNotes,
      contactName: serviceRequestTable.contactName,
      contactEmail: serviceRequestTable.contactEmail,
      contactPhone: serviceRequestTable.contactPhone,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
      organizationLogo: organizationTable.logo,
      organizationWebsite: organizationTable.website,
      // organizationDescription: organizationTable.description, // Field doesn't exist
      userId: serviceRequestTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
      createdAt: serviceRequestTable.createdAt,
      updatedAt: serviceRequestTable.updatedAt,
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
    .where(eq(serviceRequestTable.id, id));

  if (!request) return null;

  // Parse messages into conversation format
  const messages: Array<{
    type: 'user' | 'admin';
    content: string;
    timestamp: string;
    label: string;
  }> = [];

  // Parse user messages
  if (request.message) {
    const parts = request.message.split(/--- Mensaje adicional del usuario \((.*?)\) ---/);
    
    // First part is the original message
    if (parts[0] && parts[0].trim()) {
      messages.push({
        type: 'user',
        content: parts[0].trim(),
        timestamp: request.createdAt.toISOString(),
        label: 'Mensaje original'
      });
    }
    
    // Process additional messages
    for (let i = 1; i < parts.length; i += 2) {
      const timestamp = parts[i];
      const content = parts[i + 1];
      
      if (content && content.trim()) {
        messages.push({
          type: 'user',
          content: content.trim(),
          timestamp: timestamp || request.updatedAt.toISOString(),
          label: 'Mensaje adicional'
        });
      }
    }
  }
  
  // Parse admin responses
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
            timestamp: timestamp || request.updatedAt.toISOString(),
            label: 'Respuesta del equipo'
          });
        }
      }
    } else {
      // Legacy format
      messages.push({
        type: 'admin',
        content: request.adminNotes,
        timestamp: request.createdAt.toISOString(),
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

  return {
    ...request,
    messages
  };
}

export default async function AdminChatPage({ params, searchParams }: AdminChatPageProps) {
  const session = await auth();
  const { locale } = await params;
  const { id } = await searchParams;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // Fetch all chats
  const chats = await getServiceRequestChats();
  
  // If an ID is provided, fetch the specific conversation
  const selectedChat = id ? await getServiceRequestDetail(id) : null;
  
  // If no ID provided but there are chats, redirect to the first one
  if (!id && chats.length > 0) {
    redirect(`/${locale}/admin/messages/chat?id=${chats[0].id}`);
  }
  
  return (
    <ChatInterface 
      chats={chats}
      selectedChat={selectedChat as SelectedChatData | null}
      locale={locale}
    />
  );
}