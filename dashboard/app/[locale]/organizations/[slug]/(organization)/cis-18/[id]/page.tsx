import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { Shield, ArrowLeft, Download, Edit2, TrendingUp, TrendingDown, Minus, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import Link from 'next/link';
import { Progress } from '@workspace/ui/components/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

import { CIS18Api } from '~/src/features/cis18/data/cis18-api';
import { ScoreBadge } from '~/src/features/cis18/components/score-badge';
import { DeleteAssessmentButton } from '~/src/features/cis18/components/delete-assessment-button';
import { CIS18ControlNames } from '~/src/features/cis18/types/cis18-types';

export const metadata: Metadata = {
  title: 'Detalle CIS-18 | Auditoría Externa',
  description: 'Detalle de evaluación CIS-18',
};

interface CIS18DetailPageProps {
  params: {
    slug: string;
    id: string;
  };
}

// Control descriptions and recommendations
const controlDetails: Record<string, { description: string; recommendation: string; priority: 'critical' | 'high' | 'medium' }> = {
  control1: {
    description: 'Mantener un inventario actualizado de todos los activos físicos y virtuales de la empresa.',
    recommendation: 'Implementar herramientas de descubrimiento automático y mantener un CMDB actualizado.',
    priority: 'critical'
  },
  control2: {
    description: 'Gestionar el inventario de software autorizado y no autorizado en la organización.',
    recommendation: 'Utilizar herramientas de gestión de software y establecer políticas de uso.',
    priority: 'critical'
  },
  control3: {
    description: 'Proteger los datos sensibles mediante cifrado y control de acceso.',
    recommendation: 'Implementar DLP, clasificación de datos y cifrado en reposo y tránsito.',
    priority: 'critical'
  },
  control4: {
    description: 'Mantener configuraciones seguras en todos los dispositivos y software.',
    recommendation: 'Utilizar baselines de seguridad y herramientas de gestión de configuración.',
    priority: 'high'
  },
  control5: {
    description: 'Gestionar el ciclo de vida completo de las cuentas de usuario.',
    recommendation: 'Implementar procesos de altas/bajas y revisión periódica de privilegios.',
    priority: 'critical'
  },
  control6: {
    description: 'Controlar el acceso basado en el principio de menor privilegio.',
    recommendation: 'Implementar RBAC y autenticación multifactor para accesos críticos.',
    priority: 'critical'
  },
  control7: {
    description: 'Identificar y remediar vulnerabilidades de forma continua.',
    recommendation: 'Establecer programa de gestión de vulnerabilidades con escaneos regulares.',
    priority: 'high'
  },
  control8: {
    description: 'Recopilar, alertar y retener logs de auditoría.',
    recommendation: 'Implementar SIEM y establecer políticas de retención de logs.',
    priority: 'high'
  },
  control9: {
    description: 'Proteger contra amenazas basadas en email y navegación web.',
    recommendation: 'Implementar filtros de contenido, sandbox y entrenamiento anti-phishing.',
    priority: 'medium'
  },
  control10: {
    description: 'Prevenir, detectar y responder a malware.',
    recommendation: 'Desplegar EDR/XDR y mantener actualizadas las firmas antimalware.',
    priority: 'high'
  },
  control11: {
    description: 'Establecer procesos de backup y recuperación de datos.',
    recommendation: 'Implementar estrategia 3-2-1 de backups y realizar pruebas periódicas.',
    priority: 'high'
  },
  control12: {
    description: 'Gestionar la infraestructura de red de forma segura.',
    recommendation: 'Segmentar redes, implementar VLANs y mantener diagramas actualizados.',
    priority: 'medium'
  },
  control13: {
    description: 'Monitorear y defender la red contra amenazas.',
    recommendation: 'Implementar IDS/IPS y análisis de comportamiento de red.',
    priority: 'high'
  },
  control14: {
    description: 'Proporcionar formación en ciberseguridad a los empleados.',
    recommendation: 'Establecer programa de concienciación con simulacros periódicos.',
    priority: 'medium'
  },
  control15: {
    description: 'Gestionar riesgos de seguridad de proveedores externos.',
    recommendation: 'Evaluar seguridad de proveedores y establecer SLAs de seguridad.',
    priority: 'medium'
  },
  control16: {
    description: 'Asegurar el desarrollo y mantenimiento de aplicaciones.',
    recommendation: 'Implementar SSDLC, realizar análisis SAST/DAST y code reviews.',
    priority: 'high'
  },
  control17: {
    description: 'Establecer capacidades de respuesta a incidentes.',
    recommendation: 'Crear equipo de respuesta, playbooks y realizar simulacros.',
    priority: 'critical'
  },
  control18: {
    description: 'Realizar pruebas de penetración periódicas.',
    recommendation: 'Ejecutar pentests anuales y red team exercises.',
    priority: 'medium'
  }
};

function ControlCard({ 
  controlKey, 
  controlName, 
  score,
  previousScore 
}: { 
  controlKey: string; 
  controlName: string; 
  score: number | null | undefined;
  previousScore?: number | null;
}) {
  const controlNumber = controlKey.replace('control', '');
  const details = controlDetails[controlKey];
  const trend = previousScore !== null && previousScore !== undefined && score !== null && score !== undefined
    ? score > previousScore ? 'up' : score < previousScore ? 'down' : 'neutral'
    : null;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900';
      case 'high': return 'text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900';
      case 'medium': return 'text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900';
      default: return 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getScoreIcon = (score: number | null | undefined) => {
    if (score === null || score === undefined) return <XCircle className="h-4 w-4 text-gray-400" />;
    if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };
  
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">
                CIS-{controlNumber}
              </CardTitle>
              <Badge className={`text-xs ${getPriorityColor(details.priority)}`}>
                {details.priority === 'critical' ? 'Crítico' : details.priority === 'high' ? 'Alto' : 'Medio'}
              </Badge>
            </div>
            <CardDescription className="text-xs line-clamp-2">
              {controlName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {trend === 'neutral' && <Minus className="h-4 w-4 text-gray-400" />}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Anterior: {previousScore}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {getScoreIcon(score)}
            <ScoreBadge score={score} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress 
          value={score || 0} 
          className="h-2"
        />
        <div className="space-y-2 text-xs">
          <p className="text-muted-foreground">{details.description}</p>
          <div className="flex items-start gap-1">
            <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-900 dark:text-blue-100">{details.recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CIS18DetailPage({ params }: CIS18DetailPageProps) {
  const session = await auth();
  const { slug, id } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch all assessments to get previous scores for trend analysis
  const assessments = await CIS18Api.getAllCIS18Assessments(organizationId);
  const assessment = assessments.find(a => a.id === id);

  if (!assessment) {
    notFound();
  }

  // Find previous assessment for trend comparison
  const assessmentIndex = assessments.findIndex(a => a.id === id);
  const previousAssessment = assessmentIndex < assessments.length - 1 ? assessments[assessmentIndex + 1] : null;

  const overallScore = CIS18Api.calculateTotalScore(assessment);
  const previousScore = previousAssessment ? CIS18Api.calculateTotalScore(previousAssessment) : null;

  // Calculate statistics
  const controlScores = Object.keys(controlDetails).map(key => assessment[key as keyof typeof assessment] as number | null).filter(s => s !== null && s !== undefined) as number[];
  const avgScore = controlScores.length > 0 ? Math.round(controlScores.reduce((a, b) => a + b, 0) / controlScores.length) : 0;
  const minScore = controlScores.length > 0 ? Math.min(...controlScores) : 0;
  const maxScore = controlScores.length > 0 ? Math.max(...controlScores) : 0;
  const criticalControls = Object.entries(controlDetails).filter(([_, d]) => d.priority === 'critical');
  const criticalScores = criticalControls.map(([key]) => assessment[key as keyof typeof assessment] as number | null).filter(s => s !== null && s !== undefined) as number[];
  const avgCriticalScore = criticalScores.length > 0 ? Math.round(criticalScores.reduce((a, b) => a + b, 0) / criticalScores.length) : 0;

  // Group controls by category with improved organization
  const controlGroups = {
    'Gestión de Activos': ['control1', 'control2'],
    'Protección de Datos': ['control3', 'control11'],
    'Configuración Segura': ['control4', 'control12'],
    'Gestión de Accesos': ['control5', 'control6'],
    'Gestión de Vulnerabilidades': ['control7', 'control8'],
    'Defensa contra Malware': ['control9', 'control10'],
    'Monitoreo y Respuesta': ['control13', 'control17'],
    'Entrenamiento y Pruebas': ['control14', 'control18'],
    'Gestión de Proveedores': ['control15', 'control16'],
  };

  // Identify weak areas (controls scoring below 60%)
  const weakAreas = Object.entries(assessment)
    .filter(([key, value]) => key.startsWith('control') && typeof value === 'number' && value < 60)
    .map(([key, value]) => ({
      control: key,
      name: CIS18ControlNames[key],
      score: value as number,
      priority: controlDetails[key]?.priority
    }))
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Link
              href={`/organizations/${slug}/cis-18`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Shield className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Detalle de Evaluación CIS-18"
              info={`Evaluación del ${new Date(assessment.assessmentDate).toLocaleDateString('es-ES')}`}
            />
            <ScoreBadge score={overallScore} />
          </div>
          <PageActions>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DeleteAssessmentButton
              assessmentId={assessment.id}
              assessmentDate={assessment.assessmentDate}
              redirectUrl={`/organizations/${slug}/cis-18`}
            />
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Alert for critical issues */}
          {weakAreas.filter(a => a.priority === 'critical').length > 0 && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div>
                <AlertTitle className="ml-6 mt-1 text-red-900 dark:text-red-100">
                  Atención: Controles Críticos Requieren Mejora
                </AlertTitle>
                <AlertDescription className="mt-1 text-red-800 dark:text-red-200">
                  {weakAreas.filter(a => a.priority === 'critical').length} controles críticos están por debajo del 60%. 
                  Se recomienda priorizar estas áreas para mejorar la postura de seguridad.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Enhanced Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Puntuación Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold">{overallScore}%</p>
                  {previousScore !== null && (
                    <div className="flex items-center gap-1">
                      {overallScore > previousScore ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">+{overallScore - previousScore}%</span>
                        </>
                      ) : overallScore < previousScore ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">{overallScore - previousScore}%</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Sin cambio</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Progress value={overallScore} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Promedio de todos los controles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Controles Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgCriticalScore}%</p>
                <Progress 
                  value={avgCriticalScore} 
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Promedio de {criticalControls.length} controles críticos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rango de Puntuación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Min</p>
                    <p className="text-xl font-semibold text-red-600">{minScore}%</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Prom</p>
                    <p className="text-xl font-semibold">{avgScore}%</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-muted-foreground">Max</p>
                    <p className="text-xl font-semibold text-green-600">{maxScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {overallScore >= 80 ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Excelente</p>
                        <p className="text-xs text-muted-foreground">Postura de seguridad sólida</p>
                      </div>
                    </>
                  ) : overallScore >= 60 ? (
                    <>
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-900">Moderado</p>
                        <p className="text-xs text-muted-foreground">Requiere mejoras</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900">Crítico</p>
                        <p className="text-xs text-muted-foreground">Acción inmediata requerida</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vista General</TabsTrigger>
              <TabsTrigger value="details">Detalles por Control</TabsTrigger>
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen Ejecutivo</CardTitle>
                  <CardDescription>
                    Análisis de cumplimiento CIS-18 del {new Date(assessment.assessmentDate).toLocaleDateString('es-ES')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Fortalezas</h4>
                      {Object.entries(assessment)
                        .filter(([key, value]) => key.startsWith('control') && typeof value === 'number' && value >= 80)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <span className="text-sm text-green-900 dark:text-green-100">{CIS18ControlNames[key]}</span>
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">{value}%</Badge>
                          </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Áreas de Mejora</h4>
                      {weakAreas.slice(0, 3).map(area => (
                        <div key={area.control} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                          <span className="text-sm text-red-900 dark:text-red-100">{area.name}</span>
                          <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">{area.score}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Controls by Priority */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Controles por Prioridad</h3>
                
                {/* Critical Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Críticos</Badge>
                    <span className="text-sm text-muted-foreground">Requieren atención inmediata</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(controlDetails)
                      .filter(([_, detail]) => detail.priority === 'critical')
                      .map(([key]) => {
                        const score = assessment[key as keyof typeof assessment] as number | null;
                        const prevScore = previousAssessment ? previousAssessment[key as keyof typeof previousAssessment] as number | null : null;
                        return (
                          <ControlCard
                            key={key}
                            controlKey={key}
                            controlName={CIS18ControlNames[key]}
                            score={score}
                            previousScore={prevScore}
                          />
                        );
                      })}
                  </div>
                </div>

                {/* High Priority Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">Alta Prioridad</Badge>
                    <span className="text-sm text-muted-foreground">Importantes para la seguridad</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(controlDetails)
                      .filter(([_, detail]) => detail.priority === 'high')
                      .map(([key]) => {
                        const score = assessment[key as keyof typeof assessment] as number | null;
                        const prevScore = previousAssessment ? previousAssessment[key as keyof typeof previousAssessment] as number | null : null;
                        return (
                          <ControlCard
                            key={key}
                            controlKey={key}
                            controlName={CIS18ControlNames[key]}
                            score={score}
                            previousScore={prevScore}
                          />
                        );
                      })}
                  </div>
                </div>

                {/* Medium Priority Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Prioridad Media</Badge>
                    <span className="text-sm text-muted-foreground">Mejoras recomendadas</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(controlDetails)
                      .filter(([_, detail]) => detail.priority === 'medium')
                      .map(([key]) => {
                        const score = assessment[key as keyof typeof assessment] as number | null;
                        const prevScore = previousAssessment ? previousAssessment[key as keyof typeof previousAssessment] as number | null : null;
                        return (
                          <ControlCard
                            key={key}
                            controlKey={key}
                            controlName={CIS18ControlNames[key]}
                            score={score}
                            previousScore={prevScore}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Controls by Category */}
              {Object.entries(controlGroups).map(([category, controls]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {controls.map(controlKey => {
                      const controlName = CIS18ControlNames[controlKey];
                      const score = assessment[controlKey as keyof typeof assessment] as number | null;
                      const prevScore = previousAssessment ? previousAssessment[controlKey as keyof typeof previousAssessment] as number | null : null;
                      
                      return (
                        <ControlCard
                          key={controlKey}
                          controlKey={controlKey}
                          controlName={controlName}
                          score={score}
                          previousScore={prevScore}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {/* Prioritized Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan de Acción Recomendado</CardTitle>
                  <CardDescription>
                    Recomendaciones priorizadas basadas en los resultados de la evaluación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weakAreas.length > 0 ? (
                    <div className="space-y-4">
                      {weakAreas.map((area, index) => (
                        <div key={area.control} className="border-l-4 border-red-400 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">#{index + 1}</span>
                                <Badge className={`text-xs ${
                                  area.priority === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                  area.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                }`}>
                                  {area.priority === 'critical' ? 'Crítico' : area.priority === 'high' ? 'Alto' : 'Medio'}
                                </Badge>
                              </div>
                              <h4 className="font-medium mb-1">{area.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {controlDetails[area.control].description}
                              </p>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-green-900 dark:text-green-100">
                                  <strong>Acción recomendada:</strong> {controlDetails[area.control].recommendation}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-red-600">{area.score}%</p>
                              <p className="text-xs text-muted-foreground">Actual</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-medium text-green-900 dark:text-green-100">¡Excelente trabajo!</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Todos los controles están por encima del umbral mínimo del 60%.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Pasos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Revisar controles críticos</p>
                        <p className="text-sm text-muted-foreground">
                          Priorizar la mejora de los {weakAreas.filter(a => a.priority === 'critical').length} controles críticos identificados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Implementar mejoras</p>
                        <p className="text-sm text-muted-foreground">
                          Seguir las recomendaciones específicas para cada control
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Programar re-evaluación</p>
                        <p className="text-sm text-muted-foreground">
                          Realizar una nueva evaluación en 3-6 meses para medir el progreso
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ID de Evaluación</dt>
                  <dd className="font-medium">{assessment.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Creado</dt>
                  <dd>{new Date(assessment.createdAt).toLocaleString('es-ES')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Última Actualización</dt>
                  <dd>{new Date(assessment.updatedAt).toLocaleString('es-ES')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}