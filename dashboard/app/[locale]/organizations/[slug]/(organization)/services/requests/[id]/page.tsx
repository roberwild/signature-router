import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { 
  Clock, 
  MessageCircle, 
  Loader2, 
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  User,
  Activity,
  Info,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { getServiceRequestById } from '~/data/services/get-service-requests';
import { ConversationSection } from '~/components/services/conversation-section';
import { DocumentsSection } from '~/components/services/documents-section';

export const metadata: Metadata = {
  title: 'Detalle de Solicitud | Minery',
  description: 'Detalles de tu solicitud de servicio',
};

interface ServiceRequestDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
    locale: string;
  }>;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    icon: Clock,
    description: 'Tu solicitud ha sido recibida y está pendiente de revisión'
  },
  contacted: { 
    label: 'Contactado', 
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    icon: MessageCircle,
    description: 'Nuestro equipo te ha contactado para discutir tu solicitud'
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    icon: Loader2,
    description: 'Estamos trabajando activamente en tu solicitud'
  },
  completed: { 
    label: 'Completado', 
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    icon: CheckCircle,
    description: 'Tu solicitud ha sido completada exitosamente'
  }
};

export default async function ServiceRequestDetailPage({ params }: ServiceRequestDetailPageProps) {
  const session = await auth();
  const { slug, id, locale } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const _ctx = await getAuthOrganizationContext();
  
  // Get the specific service request
  const request = await getServiceRequestById(id || '', session.user?.id || '');
  
  if (!request) {
    notFound();
  }

  // Mock documents data - replace with actual database query
  // TODO: Fetch from serviceRequestDocumentTable
  const documents: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: Date;
  }> = [];

  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const initialMessages = (() => {
    const messages: Array<{type: 'user' | 'admin', content: string, timestamp: string, label: string}> = [];
    
    // Parse and organize messages
    if (request.message) {
      const parts = request.message.split(/--- Mensaje adicional del usuario \((.*?)\) ---/);
      
      if (parts[0] && parts[0].trim()) {
        messages.push({
          type: 'user',
          content: parts[0].trim(),
          timestamp: request.createdAt.toISOString(),
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
            timestamp: timestamp || request.updatedAt.toISOString(),
            label: 'Mensaje adicional'
          });
        }
      }
    }
    
    // Parse admin responses with timestamps
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
        messages.push({
          type: 'admin',
          content: request.adminNotes,
          timestamp: request.createdAt.toISOString(),
          label: 'Respuesta del equipo'
        });
      }
    }
    
    messages.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
    
    return messages;
  })();

  // Components for different sections
  const ServiceInfoSection = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Servicio Solicitado</p>
            <p className="text-lg font-semibold">{request.serviceName}</p>
          </div>
          
          {request.serviceType && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de Servicio</p>
              <p>{request.serviceType}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Solicitud</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>{format(new Date(request.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Última Actualización</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p>{format(new Date(request.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p>{request.contactName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{request.contactEmail}</p>
            </div>
          </div>
          
          {request.contactPhone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p>{request.contactPhone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const TimelineSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Línea de Tiempo</CardTitle>
        <CardDescription>Historial de tu solicitud</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div className="w-0.5 h-full bg-muted"></div>
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium">Solicitud Creada</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(request.createdAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          
          {request.status !== 'pending' && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <StatusIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium">Estado actualizado a {status.label}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.updatedAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            index={{
              route: routes.dashboard.organizations.slug.services.requests.Index,
              title: "Mis Solicitudes"
            }}
            title={request.serviceName}
          />
        </PagePrimaryBar>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          {/* Status Card - Always visible */}
          <Card className={`border-2 ${status.color} mb-6`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className="h-6 w-6" />
                  <div>
                    <CardTitle>Estado Actual: {status.label}</CardTitle>
                    <CardDescription className="mt-1">
                      {status.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={status.color} variant="outline">
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Mobile Layout - Tabs */}
          <div className="lg:hidden">
            <Tabs defaultValue="conversation" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="conversation" className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                  {documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      {documents.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Línea</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversation" className="mt-6">
                <ConversationSection 
                  requestId={id}
                  requestStatus={request.status}
                  locale={locale}
                  slug={slug}
                  initialMessages={initialMessages}
                />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-6">
                <DocumentsSection
                  documents={documents.map(doc => ({
                    id: doc.id,
                    fileName: doc.name,
                    fileUrl: doc.url,
                    fileType: 'application/octet-stream', // Default type since not provided
                    fileSize: doc.size,
                    uploadedByAdmin: false, // Default value since not provided
                    createdAt: doc.uploadedAt,
                    uploadedByName: undefined
                  }))}
                  requestStatus={request.status}
                  canUpload={false}
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-6">
                <TimelineSection />
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <ServiceInfoSection />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Layout - Split View */}
          <div className="hidden lg:grid lg:grid-cols-[400px_1fr] lg:gap-6">
            {/* Left Panel - Info & Timeline */}
            <div className="space-y-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 pr-4">
                  <ServiceInfoSection />
                  <TimelineSection />
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Conversation and Documents */}
            <div className="min-h-0">
              <Tabs defaultValue="conversation" className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="conversation" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversación
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-2">
                    <Paperclip className="h-4 w-4" />
                    Documentos
                    {documents.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                        {documents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="conversation" className="mt-4">
                  <ConversationSection 
                    requestId={id}
                    requestStatus={request.status}
                    locale={locale}
                    slug={slug}
                    initialMessages={initialMessages}
                  />
                </TabsContent>
                
                <TabsContent value="documents" className="mt-4">
                  <DocumentsSection
                    documents={documents.map(doc => ({
                      id: doc.id,
                      fileName: doc.name,
                      fileUrl: doc.url,
                      fileType: 'application/octet-stream', // Default type since not provided
                      fileSize: doc.size,
                      uploadedByAdmin: false, // Default value since not provided
                      createdAt: doc.uploadedAt,
                      uploadedByName: undefined
                    }))}
                    requestStatus={request.status}
                    canUpload={false}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}