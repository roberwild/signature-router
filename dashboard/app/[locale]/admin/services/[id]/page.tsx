import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  Building2,
  MessageCircle,
  Clock,
  CheckCircle,
  Loader2,
  Save,
  Shield,
  Folder,
  Archive,
  Activity,
  History,
  Tag,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { serviceRequestTable, organizationTable, userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { AdminPageTitle } from '../../components/admin-page-title';
import { AdminConversationSection } from '~/components/services/admin-conversation-section';
import { DocumentManagementSection } from '~/components/services/document-management-section';
import { DeleteServiceRequestButton } from './delete-button';

export const metadata: Metadata = {
  title: 'Service Request Details | Admin Panel',
  description: 'View and manage service request',
};

interface AdminServiceRequestDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    icon: Clock
  },
  contacted: { 
    label: 'Contactado', 
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    icon: MessageCircle
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    icon: Loader2
  },
  completed: { 
    label: 'Completado', 
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    icon: CheckCircle
  }
};

async function getServiceRequestDetails(id: string) {
  const [request] = await db
    .select({
      id: serviceRequestTable.id,
      serviceType: serviceRequestTable.serviceType,
      serviceName: serviceRequestTable.serviceName,
      status: serviceRequestTable.status,
      message: serviceRequestTable.message,
      adminNotes: serviceRequestTable.adminNotes,
      contactName: serviceRequestTable.contactName,
      contactEmail: serviceRequestTable.contactEmail,
      contactPhone: serviceRequestTable.contactPhone,
      createdAt: serviceRequestTable.createdAt,
      updatedAt: serviceRequestTable.updatedAt,
      organizationId: serviceRequestTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
      userId: serviceRequestTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
    })
    .from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .leftJoin(userTable, eq(serviceRequestTable.userId, userTable.id))
    .where(eq(serviceRequestTable.id, id))
    .limit(1);

  return request;
}

export default async function AdminServiceRequestDetailPage({ params }: AdminServiceRequestDetailPageProps) {
  const session = await auth();
  const { id, locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  await requirePlatformAdmin();
  
  const request = await getServiceRequestDetails(id);
  
  if (!request) {
    notFound();
  }
  
  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Service Request Details" 
              info={`ID: ${request.id.slice(0, 8)}...`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <DeleteServiceRequestButton 
            requestId={id}
            contactName={request.contactName}
            locale={locale}
          />
          
          <Link href={`/${locale}/admin/services`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Service Type</p>
                    <p className="text-lg font-semibold">{request.serviceType || 'Standard'}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold">
                      {(() => {
                        const created = new Date(request.createdAt);
                        const updated = new Date(request.updatedAt);
                        const diff = Math.abs(updated.getTime() - created.getTime());
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
                      })()}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Messages</p>
                    <p className="text-lg font-semibold">
                      {(() => {
                        let count = 0;
                        if (request.message) count++;
                        if (request.adminNotes) {
                          const adminMessages = request.adminNotes.split('--- Respuesta del admin').length - 1;
                          count += adminMessages > 0 ? adminMessages : 1;
                        }
                        const userMessages = request.message?.split('--- Mensaje adicional del usuario').length || 0;
                        return count + Math.max(0, userMessages - 1);
                      })()}
                    </p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            
            <Card className={`border-l-4 ${status.color.includes('yellow') ? 'border-l-yellow-500' : status.color.includes('green') ? 'border-l-green-500' : status.color.includes('orange') ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <p className="text-lg font-semibold">{status.label}</p>
                  </div>
                  <StatusIcon className="h-8 w-8 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Main Content - Now spans 3 columns for more space */}
            <div className="lg:col-span-3 space-y-6">
              {/* Service Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {request.serviceName}
                    </CardTitle>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Service Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Service Details</h3>
                      {request.serviceType && (
                        <div className="flex items-start gap-3">
                          <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="text-sm font-medium">{request.serviceType}</p>
                          </div>
                        </div>
                      )}
                    
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Requested</p>
                          <p className="text-sm font-medium">{format(new Date(request.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{format(new Date(request.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Request ID</p>
                          <p className="text-sm font-mono">{request.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h3>
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Organization</p>
                          <Link 
                            href={`/${locale}/organizations/${request.organizationSlug}/home`}
                            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {request.organizationName}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <p className="text-sm font-medium">{request.contactName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <a href={`mailto:${request.contactEmail}`} className="text-sm font-medium text-primary hover:underline">
                            {request.contactEmail}
                          </a>
                        </div>
                      </div>
                      
                      {request.contactPhone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{request.contactPhone}</p>
                              <Button size="sm" variant="ghost" className="h-6 px-2" asChild>
                                <a 
                                  href={`https://wa.me/${request.contactPhone.replace(/\D/g, '')}?text=Hola ${request.contactName}, somos de Minery Guard. Recibimos tu solicitud de ${request.serviceName}.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Content - Extended */}
              <Tabs defaultValue="conversation" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="conversation" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Conversation</span>
                    <span className="sm:hidden">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="hidden sm:inline">Documents</span>
                    <span className="sm:hidden">Docs</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Activity Log</span>
                    <span className="sm:hidden">Log</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Details</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="conversation" className="space-y-4">
                  <AdminConversationSection 
                    requestId={id}
                    requestStatus={request.status}
                    locale={locale}
                    contactName={request.contactName}
                    initialMessages={(() => {
                      const messages: Array<{type: 'user' | 'admin', content: string, timestamp: string, label: string}> = [];
                      
                      // Parse and organize messages
                      if (request.message) {
                        // Split by the additional message separator
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
                        
                        // Process additional messages (odd indices are timestamps, even indices are messages)
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
                      
                      // Parse admin responses with timestamps
                      if (request.adminNotes) {
                        // Check if admin notes have timestamp format
                        if (request.adminNotes.includes('--- Respuesta del admin')) {
                          // Split by admin response separator
                          const adminParts = request.adminNotes.split(/--- Respuesta del admin \((.*?)\) ---/);
                          
                          // Process admin messages (odd indices are timestamps, even indices are messages)
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
                          // Legacy format without timestamp
                          messages.push({
                            type: 'admin',
                            content: request.adminNotes,
                            timestamp: request.createdAt.toISOString(), // Use created date for legacy notes
                            label: 'Respuesta del equipo'
                          });
                        }
                      }
                      
                      // Sort messages by timestamp (oldest first)
                      messages.sort((a, b) => {
                        const dateA = new Date(a.timestamp).getTime();
                        const dateB = new Date(b.timestamp).getTime();
                        return dateA - dateB;
                      });
                      
                      return messages;
                    })()}
                  />
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <DocumentManagementSection 
                    requestId={id}
                    documents={[]} // TODO: Load actual documents from database
                  />
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Timeline</CardTitle>
                      <CardDescription>Complete history of all actions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Timeline of activities */}
                        <div className="relative pl-8 pb-4 border-l-2 border-muted">
                          <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-primary" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Request Created</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(request.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                            </p>
                            <p className="text-sm text-muted-foreground">Service request submitted by {request.contactName}</p>
                          </div>
                        </div>
                        
                        {request.status !== 'pending' && (
                          <div className="relative pl-8 pb-4 border-l-2 border-muted">
                            <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-blue-500" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Status Updated</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                              </p>
                              <p className="text-sm text-muted-foreground">Status changed to {status.label}</p>
                            </div>
                          </div>
                        )}
                        
                        {request.adminNotes && (
                          <div className="relative pl-8 pb-4 border-l-2 border-muted">
                            <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-green-500" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Admin Response Added</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                              </p>
                              <p className="text-sm text-muted-foreground">Administrator added a response</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Original Request Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {request.message?.split('--- Mensaje adicional del usuario')[0].trim() || 'No message provided'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {request.userName && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">User Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Account User</p>
                            <p className="text-sm font-medium">{request.userName}</p>
                          </div>
                        </div>
                        {request.userEmail && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">User Email</p>
                              <p className="text-sm font-medium">{request.userEmail}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Status & Actions */}
            <div className="space-y-4">

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <a href={`mailto:${request.contactEmail}?subject=Re: ${request.serviceName} Request&body=Hello ${request.contactName},%0D%0A%0D%0AThank you for your service request regarding ${request.serviceName}.`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </a>
                  </Button>
                  
                  {request.contactPhone && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <a 
                        href={`https://wa.me/${request.contactPhone.replace(/\D/g, '')}?text=Hola ${request.contactName}, somos de Minery Guard. Recibimos tu solicitud de ${request.serviceName}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp Message
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/${locale}/organizations/${request.organizationSlug}/home`}>
                      <Building2 className="mr-2 h-4 w-4" />
                      View Organization
                    </Link>
                  </Button>
                  
                  <Separator className="my-2" />
                  
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <Star className="mr-2 h-4 w-4" />
                    Add to Favorites
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Request
                  </Button>
                </CardContent>
              </Card>

              
              {/* Status Update Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={async (formData) => {
                    'use server';
                    
                    const newStatus = formData.get('status') as string;
                    const newAdminNote = formData.get('adminNotes') as string;
                    
                    if (newStatus || newAdminNote) {
                      const updates: Record<string, string> = {};
                      if (newStatus && newStatus !== request.status) {
                        updates.status = newStatus;
                      }
                      
                      // Append new admin note with timestamp
                      if (newAdminNote && newAdminNote.trim()) {
                        const timestamp = new Date().toISOString();
                        if (request.adminNotes) {
                          // Check if the existing notes already have timestamps
                          if (request.adminNotes.includes('--- Respuesta del admin')) {
                            // Append to existing timestamped notes
                            updates.adminNotes = `${request.adminNotes}\n\n--- Respuesta del admin (${timestamp}) ---\n${newAdminNote}`;
                          } else {
                            // Convert existing note to timestamped format
                            const originalTimestamp = request.createdAt;
                            updates.adminNotes = `--- Respuesta del admin (${originalTimestamp}) ---\n${request.adminNotes}\n\n--- Respuesta del admin (${timestamp}) ---\n${newAdminNote}`;
                          }
                        } else {
                          // First admin note
                          updates.adminNotes = `--- Respuesta del admin (${timestamp}) ---\n${newAdminNote}`;
                        }
                      }
                      
                      if (Object.keys(updates).length > 0) {
                        await db
                          .update(serviceRequestTable)
                          .set(updates)
                          .where(eq(serviceRequestTable.id, id));
                      }
                    }
                    
                    redirect(`/${locale}/admin/services/${id}`);
                  }}>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Status</Label>
                        <Select name="status" defaultValue={request.status}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="contacted">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="h-3 w-3" />
                                Contacted
                              </div>
                            </SelectItem>
                            <SelectItem value="in-progress">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3" />
                                In Progress
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Quick Note</Label>
                        <Textarea
                          name="adminNotes"
                          placeholder="Add a quick response or note..."
                          rows={4}
                          className="text-sm"
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Update Status
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}