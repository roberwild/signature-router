import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Briefcase, 
  Clock, 
  MessageCircle, 
  Loader2, 
  CheckCircle,
  Calendar,
  Filter,
  Search,
  Plus,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  FileText,
  Sparkles
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

import { Input } from '@workspace/ui/components/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { getUserServiceRequests } from '~/data/services/get-service-requests';

export const metadata: Metadata = {
  title: 'Mis Solicitudes de Servicio | Minery',
  description: 'Seguimiento de tus solicitudes de servicios premium',
};

interface ServiceRequestsPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

// Interface for service request data
interface ServiceRequest {
  id: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  serviceName: string;
  message: string | null;
  adminNotes: string | null | undefined;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const statusConfig = {
  pending: { 
    label: 'Pendiente', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock 
  },
  contacted: { 
    label: 'Contactado', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: MessageCircle 
  },
  'in-progress': { 
    label: 'En Progreso', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    icon: Loader2 
  },
  completed: { 
    label: 'Completado', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle 
  }
};

export default async function ServiceRequestsPage({ params }: ServiceRequestsPageProps) {
  const session = await auth();
  const { slug, locale } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  
  // Get user's service requests
  const requests = await getUserServiceRequests(session.user?.id || '', ctx.organization.id);

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  // Sort requests by status priority and date
  const sortedRequests = [...requests].sort((a, b) => {
    const statusPriority = { 
      'in-progress': 0, 
      'contacted': 1, 
      'pending': 2, 
      'completed': 3 
    };
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] ?? 4;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] ?? 4;
    
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Group requests by status
  const groupedRequests = {
    active: sortedRequests.filter(r => r.status !== 'completed'),
    completed: sortedRequests.filter(r => r.status === 'completed')
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            index={{
              route: routes.dashboard.organizations.slug.services.Index,
              title: "Servicios"
            }}
            title="Mis Solicitudes"
          />
          <PageActions>
            <Link href={`/${locale}/organizations/${slug}/services`}>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Solicitud
              </Button>
            </Link>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl p-6">
          {requests.length === 0 ? (
            // Enhanced Empty State
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl blur-3xl" />
              <Card className="relative border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                    <div className="relative bg-primary/10 p-4 rounded-full">
                      <Briefcase className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-3">
                    Aún no tienes solicitudes
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-8">
                    Explora nuestros servicios premium de ciberseguridad y solicita 
                    el que mejor se adapte a las necesidades de tu empresa
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/${locale}/organizations/${slug}/services`}>
                      <Button size="lg" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Explorar Servicios Premium
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contactar Soporte
                    </Button>
                  </div>

                  <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                    <div className="text-center">
                      <div className="bg-muted/50 p-3 rounded-lg mb-2">
                        <Clock className="h-6 w-6 mx-auto text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Respuesta Rápida</p>
                      <p className="text-xs text-muted-foreground">En menos de 24h</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-muted/50 p-3 rounded-lg mb-2">
                        <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Seguimiento</p>
                      <p className="text-xs text-muted-foreground">En tiempo real</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-muted/50 p-3 rounded-lg mb-2">
                        <MessageCircle className="h-6 w-6 mx-auto text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Comunicación</p>
                      <p className="text-xs text-muted-foreground">Directa y clara</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <FileText className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={stats.pending > 0 ? 'border-yellow-500/50 bg-yellow-50/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pendientes</p>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={stats.contacted > 0 ? 'border-blue-500/50 bg-blue-50/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Contactados</p>
                        <p className="text-2xl font-bold">{stats.contacted}</p>
                      </div>
                      <MessageCircle className="h-8 w-8 text-blue-500/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={stats.inProgress > 0 ? 'border-orange-500/50 bg-orange-50/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">En Progreso</p>
                        <p className="text-2xl font-bold">{stats.inProgress}</p>
                      </div>
                      <Loader2 className="h-8 w-8 text-orange-500/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={stats.completed > 0 ? 'border-green-500/50 bg-green-50/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completados</p>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500/30" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por servicio o mensaje..." 
                    className="pl-10"
                    disabled
                  />
                </div>
                <Button variant="outline" className="gap-2" disabled>
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </div>

              {/* Service Requests with Tabs */}
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="active" className="gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Activas ({groupedRequests.active.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completadas ({groupedRequests.completed.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6 space-y-4">
                  {groupedRequests.active.length === 0 ? (
                    <Card className="py-8">
                      <CardContent className="text-center">
                        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No tienes solicitudes activas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {groupedRequests.active.map((request) => (
                        <ServiceRequestCard 
                          key={request.id} 
                          request={request} 
                          slug={slug}
                          locale={locale}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6 space-y-4">
                  {groupedRequests.completed.length === 0 ? (
                    <Card className="py-8">
                      <CardContent className="text-center">
                        <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No tienes solicitudes completadas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {groupedRequests.completed.map((request) => (
                        <ServiceRequestCard 
                          key={request.id} 
                          request={request} 
                          slug={slug}
                          locale={locale}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  );
}

function ServiceRequestCard({
  request,
  slug,
  locale
}: {
  request: ServiceRequest;
  slug: string;
  locale: string;
}) {
  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Parse messages to count them
  const parseMessages = (messageText: string | null) => {
    if (!messageText) return { original: '', count: 0 };

    // Split by additional message separator
    const parts = messageText.split(/--- Mensaje adicional del usuario \(.*?\) ---/);
    const original = parts[0]?.trim() || '';
    const additionalCount = Math.max(0, parts.length - 1);

    return {
      original: original.length > 150 ? original.substring(0, 150) + '...' : original,
      count: additionalCount + (original ? 1 : 0)
    };
  };

  const parseAdminMessages = (adminNotes: string | null | undefined) => {
    if (!adminNotes) return { latest: '', count: 0 };

    // Check if it has timestamp format
    if (adminNotes.includes('--- Respuesta del admin')) {
      const parts = adminNotes.split(/--- Respuesta del admin \(.*?\) ---/);
      const messages = parts.filter((p, i) => i > 0 && p.trim());
      const latest = messages[messages.length - 1]?.trim() || '';
      return {
        latest: latest.length > 150 ? latest.substring(0, 150) + '...' : latest,
        count: messages.length
      };
    }

    // Legacy format
    return {
      latest: adminNotes.length > 150 ? adminNotes.substring(0, 150) + '...' : adminNotes,
      count: 1
    };
  };

  const userMessages = parseMessages(request.message);
  const adminMessages = parseAdminMessages(request.adminNotes);
  const totalMessages = userMessages.count + adminMessages.count;
  const hasUnreadAdmin = adminMessages.count > 0;
  const timeAgo = formatDistanceToNow(new Date(request.updatedAt), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <Link href={`/${locale}/organizations/${slug}/services/requests/${request.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden border-2 hover:border-primary/20 cursor-pointer">
      <div className="flex">
        {/* Enhanced Status indicator bar */}
        <div className={`w-2 transition-all duration-200 group-hover:w-3 ${
          request.status === 'completed' ? 'bg-gradient-to-b from-green-400 to-green-600' :
          request.status === 'in-progress' ? 'bg-gradient-to-b from-orange-400 to-orange-600 animate-pulse' :
          request.status === 'contacted' ? 'bg-gradient-to-b from-blue-400 to-blue-600' :
          'bg-gradient-to-b from-yellow-400 to-yellow-600'
        }`} />
        
        <div className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    request.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                    request.status === 'in-progress' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    request.status === 'contacted' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <StatusIcon className={`h-4 w-4 ${
                      request.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      request.status === 'in-progress' ? 'text-orange-600 dark:text-orange-400' :
                      request.status === 'contacted' ? 'text-blue-600 dark:text-blue-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold line-clamp-1 mb-1">
                      {request.serviceName}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.createdAt), "dd MMM yyyy", { locale: es })}
                      </span>
                      {totalMessages > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className={`h-3 w-3 ${hasUnreadAdmin ? 'text-primary' : ''}`} />
                          <span className={hasUnreadAdmin ? 'font-medium text-primary' : ''}>
                            {totalMessages} {totalMessages === 1 ? 'mensaje' : 'mensajes'}
                          </span>
                        </span>
                      )}
                      <span className="text-muted-foreground/60">•</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge 
                  variant="outline" 
                  className={`${status.color} font-medium`}
                >
                  {status.label}
                </Badge>
                {hasUnreadAdmin && (
                  <Badge variant="default" className="animate-pulse text-xs">
                    Nueva respuesta
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Enhanced Latest interaction preview */}
            {(userMessages.original || adminMessages.latest) && (
              <div className="mb-4">
                {adminMessages.latest ? (
                  <div className="relative p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-l-3 border-primary">
                    <p className="text-xs font-semibold mb-1.5 text-primary flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      Respuesta del equipo Minery
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                      {adminMessages.latest}
                    </p>
                  </div>
                ) : userMessages.original && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs font-medium mb-1.5 text-muted-foreground">Tu mensaje inicial:</p>
                    <p className="text-sm text-muted-foreground/90 line-clamp-2">
                      {userMessages.original}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Enhanced Action area */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                {request.status === 'in-progress' && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      En proceso
                    </span>
                  </div>
                )}
                {request.status === 'contacted' && hasUnreadAdmin && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-primary">
                      Respuesta disponible
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                Ver detalles
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
    </Link>
  );
}