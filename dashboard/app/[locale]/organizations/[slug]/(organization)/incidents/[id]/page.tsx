import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  Shield,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  FileText,
  ChevronLeft,
  History,
} from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { buttonVariants } from '@workspace/ui/components/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';

import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { TokenDisplay } from '~/src/features/incidents/components/token-display';
import { IncidentSecondaryActions } from '~/src/features/incidents/components/incident-secondary-actions';

export const metadata: Metadata = {
  title: 'Detalle del Incidente | Ciberseguridad',
  description: 'Ver y gestionar el incidente de ciberseguridad',
};

interface IncidentDetailPageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  const session = await auth();
  const { slug, id } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch incident with history
  const incidentData = await incidentDb.getIncidentWithHistory(id);

  if (!incidentData) {
    notFound();
  }

  const { incident, versions } = incidentData;
  const latestVersion = versions.find(v => v.isLatest) || versions[0];

  // Verify the incident belongs to this organization
  if (incident.organizationId !== organizationId) {
    notFound();
  }

  // Helper function to format dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'No especificada';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const _formatDateShort = (date: Date | null | undefined) => {
    if (!date) return 'No especificada';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (latestVersion.fechaResolucion) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Resuelto
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500">
        <Clock className="mr-1 h-3 w-3" />
        En proceso
      </Badge>
    );
  };

  // Calculate deadline (72 hours from detection)
  const calculateDeadline = () => {
    if (!latestVersion.fechaDeteccion) return null;
    const detection = new Date(latestVersion.fechaDeteccion);
    const deadline = new Date(detection.getTime() + 72 * 60 * 60 * 1000);
    const now = new Date();
    const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (latestVersion.notificadoAEPD) {
      return { status: 'completed', text: 'Notificado' };
    }
    if (hoursRemaining < 0) {
      return { status: 'overdue', text: 'Vencido', hours: Math.abs(hoursRemaining) };
    }
    if (hoursRemaining < 24) {
      return { status: 'critical', text: `${hoursRemaining}h restantes`, hours: hoursRemaining };
    }
    if (hoursRemaining < 48) {
      return { status: 'warning', text: `${hoursRemaining}h restantes`, hours: hoursRemaining };
    }
    return { status: 'ok', text: `${hoursRemaining}h restantes`, hours: hoursRemaining };
  };

  const deadline = calculateDeadline();

  return (
    <Page>
      <PageHeader>
        {/* Tier 1 - Primary Header */}
        <PagePrimaryBar>
          <div className="flex items-center gap-4">
            <Link
              href={`/organizations/${slug}/incidents`}
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold truncate">
                  Incidente #{incident.internalId}
                </h1>
              </div>
            </div>
          </div>
          <PageActions>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Link
                href={`/organizations/${slug}/incidents/${id}/edit`}
                className={buttonVariants({ variant: 'default', size: 'sm' })}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </div>
          </PageActions>
        </PagePrimaryBar>
        
        {/* Tier 2 - Secondary Info Bar */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Creado el {formatDate(incident.createdAt)}</span>
              {versions.length > 1 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span>
                    Versión {latestVersion.versionNumber} de {versions.length}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Show AEPD deadline only if critical or overdue */}
              {deadline && (deadline.status === 'critical' || deadline.status === 'overdue') && (
                <Badge 
                  variant="outline"
                  className={
                    deadline.status === 'overdue' ? 'border-red-500 text-red-500' :
                    'border-red-500 text-red-500'
                  }
                >
                  <Clock className="mr-1 h-3 w-3" />
                  AEPD: {deadline.text}
                </Badge>
              )}
              {/* Secondary Actions Dropdown */}
              <IncidentSecondaryActions
                slug={slug}
                incidentId={id}
                token={latestVersion.token}
                incident={incident}
                currentVersion={latestVersion}
                totalVersions={versions.length}
              />
            </div>
          </div>
        </div>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Token Display Card */}
          <TokenDisplay 
            token={latestVersion.token}
            versionNumber={latestVersion.versionNumber}
            totalVersions={versions.length}
          />

          {/* Deadline Alert if critical */}
          {deadline && (deadline.status === 'critical' || deadline.status === 'overdue') && !latestVersion.notificadoAEPD && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="ml-6 mt-1">
                {deadline.status === 'overdue' ? 'Plazo AEPD Vencido' : 'Plazo AEPD Crítico'}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {deadline.status === 'overdue' 
                  ? `El plazo de 72 horas para notificar a la AEPD venció hace ${deadline.hours} horas. Es crucial notificar inmediatamente.`
                  : `Quedan solo ${deadline.hours} horas para notificar a la AEPD. El incumplimiento puede conllevar sanciones.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Incident Information Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Incidente</CardTitle>
              <CardDescription>
                Versión {latestVersion.versionNumber} - Última actualización: {formatDate(latestVersion.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="impact">Impacto</TabsTrigger>
                  <TabsTrigger value="measures">Medidas</TabsTrigger>
                  <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Fecha de Detección
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(latestVersion.fechaDeteccion)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Tipo de Incidente
                      </label>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{latestVersion.tipoIncidente || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Descripción
                    </label>
                    <p className="text-sm leading-relaxed">
                      {latestVersion.descripcion || 'No se ha proporcionado una descripción'}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Categorías de Datos Afectados
                    </label>
                    <p className="text-sm">
                      {latestVersion.categoriasDatos || 'No especificadas'}
                    </p>
                  </div>
                  {latestVersion.fechaResolucion && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Fecha de Resolución
                        </label>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <p className="font-medium text-green-600">
                            {formatDate(latestVersion.fechaResolucion)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="impact" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Número de Afectados
                      </label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {latestVersion.numeroAfectados || 0} personas
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Categorías de Datos
                      </label>
                      <p className="font-medium">
                        {latestVersion.categoriasDatos?.split(',').length || 0} categorías
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Consecuencias
                    </label>
                    <p className="text-sm leading-relaxed">
                      {latestVersion.consecuencias || 'No especificadas'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="measures" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Medidas Adoptadas
                    </label>
                    <p className="text-sm leading-relaxed">
                      {latestVersion.medidasAdoptadas || 'No se han especificado medidas adoptadas'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          Notificación AEPD
                          {latestVersion.notificadoAEPD ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Notificado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pendiente
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {latestVersion.notificadoAEPD ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Fecha de notificación:
                            </p>
                            <p className="font-medium">
                              {formatDate(latestVersion.fechaNotificacionAEPD)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No se ha notificado a la AEPD
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          Notificación Afectados
                          {latestVersion.notificadoAfectados ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Notificado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pendiente
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {latestVersion.notificadoAfectados ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Fecha de notificación:
                            </p>
                            <p className="font-medium">
                              {formatDate(latestVersion.fechaNotificacionAfectados)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No se ha notificado a los afectados
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Version Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Versiones</CardTitle>
              <CardDescription>
                Este incidente tiene {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Última actualización: {formatDate(latestVersion.createdAt)}
                  </span>
                </div>
                <Link
                  href={`/organizations/${slug}/incidents/${id}/history`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  <History className="mr-2 h-4 w-4" />
                  Ver historial completo
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}