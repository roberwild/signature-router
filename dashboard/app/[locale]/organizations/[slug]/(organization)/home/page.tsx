import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import Link from 'next/link';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  FileText,
  ArrowRight,
  Activity,
  BarChart3,
  Target,
  Zap,
  Calendar,
  ExternalLink,
  Briefcase
} from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {  buttonVariants } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Progress } from '@workspace/ui/components/progress';
import { Badge } from '@workspace/ui/components/badge';
import {
  Page,
  PageBody,
} from '@workspace/ui/components/page';

import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Separator } from '@workspace/ui/components/separator';

import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { AssessmentApi } from '~/src/features/assessments/data/assessment-api';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

// Follow-up questionnaire imports

// Basic interfaces for incident data
interface IncidentBasic {
  id: string;
  internalId: number;
  createdAt: string | Date;
}

interface IncidentVersionBasic {
  id: string;
  incidentId: string;
  token: string;
  fechaDeteccion: Date | null;
  descripcion: string | null;
  tipoIncidente: string | null;
  categoriasDatos: string | null;
  numeroAfectados: number | null;
  consecuencias: string | null;
  medidasAdoptadas: string | null;
  fechaResolucion: Date | null;
  notificadoAEPD: boolean | null;
  fechaNotificacionAEPD: Date | null;
  notificadoAfectados: boolean | null;
  fechaNotificacionAfectados: Date | null;
  isLatest: boolean;
  versionNumber: number;
  createdBy: string;
  createdAt: Date;
}

export const metadata: Metadata = {
  title: 'Dashboard | Panel de Control',
  description: 'Panel de control de ciberseguridad y cumplimiento',
};

interface HomePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Quick Stats Component
function QuickStat({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendValue,
  color = 'primary' 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
            ) : (
              <Activity className="h-3 w-3 text-gray-600" />
            )}
            <span className={`text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Recent Incident Item
function RecentIncidentItem({
  incident,
  version,
  slug
}: {
  incident: IncidentBasic;
  version: IncidentVersionBasic;
  slug: string;
}) {
  const hoursAgo = differenceInHours(new Date(), new Date(incident.createdAt));
  const daysAgo = differenceInDays(new Date(), new Date(incident.createdAt));
  
  const timeAgo = daysAgo > 0 
    ? `hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`
    : `hace ${hoursAgo} ${hoursAgo === 1 ? 'hora' : 'horas'}`;

  return (
    <Link 
      href={`/organizations/${slug}/incidents/${incident.id}`}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          version?.fechaResolucion 
            ? 'bg-green-100 dark:bg-green-900/20' 
            : 'bg-yellow-100 dark:bg-yellow-900/20'
        }`}>
          {version?.fechaResolucion ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            Incidente #{incident.internalId}
          </p>
          <p className="text-xs text-muted-foreground">
            {version?.tipoIncidente || 'Sin tipo'} • {timeAgo}
          </p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch data in parallel
  const [incidents, assessmentsResponse, incidentStats] = await Promise.all([
    incidentDb.getOrganizationIncidents(organizationId),
    AssessmentApi.getOrganizationAssessments(organizationId),
    incidentDb.getOrganizationIncidentStats(organizationId)
  ]);

  const assessments = assessmentsResponse.assessments || [];
  const latestAssessment = assessments[0];
  const previousAssessment = assessments[1];

  // Calculate metrics
  const activeIncidents = incidents.filter(i => 
    i.latestVersion && !i.latestVersion.fechaResolucion
  ).length;

  const criticalIncidents = incidents.filter(i => {
    if (!i.latestVersion || i.latestVersion.fechaResolucion) return false;
    const hoursElapsed = i.latestVersion.fechaDeteccion 
      ? Math.floor((Date.now() - new Date(i.latestVersion.fechaDeteccion).getTime()) / (1000 * 60 * 60))
      : 0;
    return hoursElapsed > 48 && hoursElapsed <= 72 && !i.latestVersion.notificadoAEPD;
  }).length;

  const recentIncidents = incidents
    .filter(({ latestVersion }) => latestVersion !== null)
    .slice(0, 5)
    .map(({ incident, latestVersion }) => ({ incident, latestVersion: latestVersion! }));

  // Assessment scores
  const currentScore = latestAssessment
    ? Math.round(((latestAssessment.scorePersonas ?? 0) + (latestAssessment.scoreProcesos ?? 0) + (latestAssessment.scoreSistemas ?? 0)) / 3)
    : 0;

  const scoreTrend = latestAssessment && previousAssessment
    ? Math.round(((latestAssessment.scorePersonas ?? 0) + (latestAssessment.scoreProcesos ?? 0) + (latestAssessment.scoreSistemas ?? 0)) / 3) -
      Math.round(((previousAssessment.scorePersonas ?? 0) + (previousAssessment.scoreProcesos ?? 0) + (previousAssessment.scoreSistemas ?? 0)) / 3)
    : 0;

  // Calculate compliance percentage (simplified)
  const complianceScore = currentScore > 0 
    ? currentScore 
    : (incidentStats.notifiedAEPD / Math.max(incidentStats.total, 1)) * 100;

  return (
    <Page>
      <PageBody>
        <div className="w-full max-w-full mx-auto lg:max-w-7xl space-y-6 p-4 sm:p-6 overflow-x-hidden">
          
          {/* Premium Services Banner - MOST PROMINENT */}
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Potencia tu Ciberseguridad con Servicios Premium
                      <Badge variant="default">NUEVO</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Protección profesional 24/7 • Auditorías • CISO as a Service • Respuesta ante Incidentes
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                <Link 
                  href={`/organizations/${slug}/services`}
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Ver Todos los Servicios
                </Link>
                <Link 
                  href={`/organizations/${slug}/assessments/new`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Test de Ciberseguridad Gratuito
                </Link>
                <a 
                  href="https://wa.me/message/C35F4AFPXDNUK1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <svg 
                    className="mr-2 h-4 w-4" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Contáctanos por WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Questionnaire Prompt (if applicable) */}
          {/* Note: This would be conditionally rendered based on lead data */}
          {/* For demonstration, showing a mock implementation */}
          {/* 
          <FollowUpPrompt
            lead={mockLead}
            questions={FollowUpQuestionnaireService.getNextQuestions(mockLead, 2)}
            onComplete={async (responses) => {
              // Handle saving responses
              console.log('Follow-up responses:', responses);
            }}
            onDismiss={() => {
              // Handle dismissal
              console.log('Follow-up dismissed');
            }}
            onSnooze={(hours) => {
              // Handle snooze
              console.log(`Snoozed for ${hours} hours`);
            }}
          />
          */}
          
          {/* Welcome Section with Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bienvenido de vuelta</CardTitle>
                  <CardDescription>
                    Aquí está el resumen de tu organización hoy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link 
                      href={`/organizations/${slug}/incidents/new`}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-all group"
                    >
                      <AlertTriangle className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
                      <span className="text-sm font-medium text-center">Registrar Incidente</span>
                      <span className="text-xs text-muted-foreground text-center">Nuevo reporte RGPD</span>
                    </Link>
                    <Link 
                      href={`/organizations/${slug}/assessments/new`}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-all group"
                    >
                      <Target className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
                      <span className="text-sm font-medium text-center">Autoevaluación de Ciberseguridad</span>
                      <span className="text-xs text-muted-foreground text-center">Evalúa tu seguridad en 5 minutos</span>
                    </Link>
                    <Link 
                      href={`/organizations/${slug}/services`}
                      className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-all group"
                    >
                      <Briefcase className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
                      <span className="text-sm font-medium text-center">Más Servicios</span>
                      <span className="text-xs text-muted-foreground text-center">Ver catálogo completo</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Score */}
            <Card className={assessments.length === 0 ? "bg-gradient-to-br from-blue-500/10 to-purple-500/5" : "bg-gradient-to-br from-red-500/10 to-orange-500/5"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Nivel de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments.length === 0 ? (
                    <>
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-3 text-primary opacity-60" />
                        <p className="text-lg font-semibold mb-2">
                          Descubre tu nivel de seguridad
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Realiza tu primera autoevaluación para conocer el estado de ciberseguridad de tu organización
                        </p>
                      </div>
                      <Link 
                        href={`/organizations/${slug}/assessments/new`}
                        className={buttonVariants({ variant: "default", size: "sm", className: "w-full" })}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        Realizar Primera Evaluación
                      </Link>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold">
                            {Math.round(100 - complianceScore)}%
                          </span>
                          {scoreTrend !== 0 && (
                            <Badge variant={scoreTrend > 0 ? "secondary" : "default"}>
                              {scoreTrend > 0 ? '+' : ''}{scoreTrend * -1}%
                            </Badge>
                          )}
                        </div>
                        <Progress value={100 - complianceScore} className="mt-2" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Basado en evaluaciones realizadas
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {criticalIncidents > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="ml-6 mt-1">Atención Requerida</AlertTitle>
              <AlertDescription className="mt-1">
                Tienes {criticalIncidents} {criticalIncidents === 1 ? 'incidente' : 'incidentes'} próximos a vencer el plazo de 72 horas para notificar a la AEPD.
                <Link 
                  href={`/organizations/${slug}/incidents`}
                  className="font-medium underline ml-1"
                >
                  Ver incidentes críticos
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickStat
              title="Incidentes Activos"
              value={activeIncidents}
              description="Requieren atención"
              icon={AlertTriangle}
              color="warning"
              trend={activeIncidents > 0 ? "up" : "neutral"}
              trendValue={activeIncidents > 0 ? "Activos" : "Sin incidentes"}
            />
            <QuickStat
              title="Resueltos este mes"
              value={incidentStats.resolved}
              description="Casos cerrados"
              icon={CheckCircle}
              color="success"
              trend="up"
              trendValue={`${incidentStats.avgResolutionTime || 0} días promedio`}
            />
            <QuickStat
              title="Puntuación Seguridad"
              value={`${currentScore}%`}
              description="Última evaluación"
              icon={Target}
              color="primary"
              trend={scoreTrend > 0 ? "up" : scoreTrend < 0 ? "down" : "neutral"}
              trendValue={scoreTrend !== 0 ? `${Math.abs(scoreTrend)}%` : "Sin cambios"}
            />
            <QuickStat
              title="Notificaciones AEPD"
              value={incidentStats.notifiedAEPD}
              description="Cumplimiento RGPD"
              icon={FileText}
              color="primary"
              trend="neutral"
              trendValue={`${incidentStats.total} total`}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Incidents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Incidentes Recientes</CardTitle>
                      <CardDescription>
                        Últimos incidentes reportados en tu organización
                      </CardDescription>
                    </div>
                    <Link 
                      href={`/organizations/${slug}/incidents`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Ver todos
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentIncidents.length > 0 ? (
                    <div className="space-y-2">
                      {recentIncidents.map(({ incident, latestVersion }) => (
                        <RecentIncidentItem
                          key={incident.id}
                          incident={incident}
                          version={latestVersion}
                          slug={slug}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No hay incidentes registrados</p>
                      <Link 
                        href={`/organizations/${slug}/incidents/new`}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
                      >
                        Registrar primer incidente
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline - Now under Recent Incidents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Actividad Reciente</CardTitle>
                      <CardDescription>
                        Últimas acciones en tu organización
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      <Calendar className="mr-1 h-3 w-3" />
                      Últimos 7 días
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incidents.slice(0, 3).map(({ incident, latestVersion }) => {
                      const date = new Date(incident.updatedAt);
                      return (
                        <div key={incident.id} className="flex gap-4">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              {latestVersion?.fechaResolucion ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">
                              Incidente #{incident.internalId} {latestVersion?.fechaResolucion ? 'resuelto' : 'actualizado'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(date, "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {assessments.slice(0, 2).map((assessment) => {
                      const date = new Date(assessment.createdAt);
                      return (
                        <div key={assessment.id} className="flex gap-4">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">
                              Evaluación completada - Puntuación: {assessment.scoreTotal}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(date, "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assessment Summary - Takes 1 column */}
            <div className="space-y-6">
              {/* Assessment Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evaluación de Madurez</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestAssessment ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Personas</span>
                            <span className="text-sm text-muted-foreground">
                              {latestAssessment.scorePersonas}%
                            </span>
                          </div>
                          <Progress value={latestAssessment.scorePersonas} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Procesos</span>
                            <span className="text-sm text-muted-foreground">
                              {latestAssessment.scoreProcesos}%
                            </span>
                          </div>
                          <Progress value={latestAssessment.scoreProcesos} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Sistemas</span>
                            <span className="text-sm text-muted-foreground">
                              {latestAssessment.scoreSistemas}%
                            </span>
                          </div>
                          <Progress value={latestAssessment.scoreSistemas} className="h-2" />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Evaluado {format(new Date(latestAssessment.createdAt), 'dd MMM', { locale: es })}
                        </span>
                        <Link 
                          href={`/organizations/${slug}/assessments`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No hay evaluaciones
                      </p>
                      <Link 
                        href={`/organizations/${slug}/assessments/new`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Realizar evaluación
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accesos Rápidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link 
                      href="https://www.aepd.es/es/documento/modelo-notificacion-quiebras-seguridad.pdf"
                      target="_blank"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Formulario AEPD</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Link 
                      href="https://www.aepd.es/es/guias-y-herramientas/herramientas/comunica-brecha-rgpd"
                      target="_blank"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Portal AEPD</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Link 
                      href={`/organizations/${slug}/settings`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Configuración</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}