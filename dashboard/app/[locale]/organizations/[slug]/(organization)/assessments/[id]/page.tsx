import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  Shield,
  ChevronLeft,
  Users,
  Settings,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Building,
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
import { Progress } from '@workspace/ui/components/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';

import { assessmentDb } from '~/src/features/assessments/data/assessment-db';
import { AssessmentQuestionsAccordion } from '~/src/features/assessments/components/assessment-questions-accordion';
import { AssessmentPdfExport } from '~/src/features/assessments/components/assessment-pdf-export';

// Import QuestionItem type for accordion
interface QuestionItem {
  category: string;
  questionId: string;
  question: string;
  answer: string;
  score: number;
  subcategory?: string;
}

export const metadata: Metadata = {
  title: 'Detalle de Evaluación | Ciberseguridad',
  description: 'Ver detalles y respuestas de la evaluación de ciberseguridad',
};

interface AssessmentDetailPageProps {
  params: {
    slug: string;
    id: string;
  };
}

// Helper functions
function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBadge(score: number) {
  if (score >= 80) return { label: 'Excelente', color: 'bg-green-500 hover:bg-green-600 text-white', icon: <CheckCircle className="h-4 w-4" /> };
  if (score >= 60) return { label: 'Bueno', color: 'bg-yellow-500 hover:bg-yellow-600 text-white', icon: <AlertCircle className="h-4 w-4" /> };
  if (score >= 40) return { label: 'Regular', color: 'bg-orange-500 hover:bg-orange-600 text-white', icon: <AlertCircle className="h-4 w-4" /> };
  return { label: 'Bajo', color: 'bg-red-500 hover:bg-red-600 text-white', icon: <XCircle className="h-4 w-4" /> };
}

function getRecommendations(scorePersonas: number, scoreProcesos: number, scoreSistemas: number) {
  const recommendations = [];
  
  if (scorePersonas < 60) {
    recommendations.push({
      category: 'Personas',
      icon: <Users className="h-4 w-4" />,
      priority: scorePersonas < 40 ? 'high' : 'medium',
      suggestions: [
        'Implementar programas de formación en ciberseguridad',
        'Establecer políticas claras de seguridad',
        'Realizar simulacros de phishing periódicos',
        'Designar responsables de seguridad en cada área'
      ]
    });
  }
  
  if (scoreProcesos < 60) {
    recommendations.push({
      category: 'Procesos',
      icon: <Settings className="h-4 w-4" />,
      priority: scoreProcesos < 40 ? 'high' : 'medium',
      suggestions: [
        'Documentar procedimientos de respuesta a incidentes',
        'Implementar auditorías de seguridad regulares',
        'Establecer protocolos de gestión de accesos',
        'Crear planes de continuidad del negocio'
      ]
    });
  }
  
  if (scoreSistemas < 60) {
    recommendations.push({
      category: 'Sistemas',
      icon: <Shield className="h-4 w-4" />,
      priority: scoreSistemas < 40 ? 'high' : 'medium',
      suggestions: [
        'Actualizar sistemas y aplicaciones regularmente',
        'Implementar sistemas de detección de intrusiones',
        'Configurar backups automáticos y cifrados',
        'Utilizar autenticación multifactor (MFA)'
      ]
    });
  }
  
  return recommendations;
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const session = await auth();
  const { slug, id } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch assessment details
  const assessment = await assessmentDb.getEvaluationById(id);

  if (!assessment) {
    notFound();
  }

  // Verify the assessment belongs to this organization
  if (assessment.organizationId !== organizationId) {
    notFound();
  }

  // Get previous assessment for comparison
  const previousAssessments = await assessmentDb.getOrganizationEvaluations(organizationId, 10);
  const currentIndex = previousAssessments.findIndex(a => a.id === id);
  const previousAssessment = currentIndex > 0 ? previousAssessments[currentIndex + 1] : null;

  // Calculate improvements
  const improvements = previousAssessment ? {
    personas: (assessment.scorePersonas ?? 0) - (previousAssessment.scorePersonas ?? 0),
    procesos: (assessment.scoreProcesos ?? 0) - (previousAssessment.scoreProcesos ?? 0),
    sistemas: (assessment.scoreSistemas ?? 0) - (previousAssessment.scoreSistemas ?? 0),
    total: (assessment.scoreTotal ?? 0) - (previousAssessment.scoreTotal ?? 0),
  } : null;

  // Get recommendations
  const recommendations = getRecommendations(
    assessment.scorePersonas ?? 0,
    assessment.scoreProcesos ?? 0,
    assessment.scoreSistemas ?? 0
  );

  // Parse test data for questions and answers
  interface TestDataStructure {
    questionsAndAnswers?: {
      personas?: Array<{ id: string; question: string; answer: number | string; category?: string }>;
      procesos?: Array<{ id: string; question: string; answer: number | string; category?: string }>;
      tecnologias?: Array<{ id: string; question: string; answer: number | string; category?: string }>;
      [key: string]: Array<{ id: string; question: string; answer: number | string; category?: string }> | undefined;
    };
    personas?: Record<string, number | string>;
    procesos?: Record<string, number | string>;
    tecnologias?: Record<string, number | string>;
  }

  const testData = assessment.testData as TestDataStructure | null;

  // Transform the raw answer data into a structured format for display
  const questionsAndAnswers: QuestionItem[] = [];
  
  // Helper to get answer label from score
  const getAnswerLabel = (score: number) => {
    switch(score) {
      case 1: return 'No implementado';
      case 2: return 'Parcialmente implementado';
      case 3: return 'Implementado';
      case 4: return 'Completamente implementado';
      default: return 'Sin respuesta';
    }
  };

  // Question text mappings (matching the form)
  const QUESTION_TEXT = {
    personas: {
      q1: 'Responsabilidad de la ciberseguridad en la empresa',
      q2: 'Compromiso de la dirección con la ciberseguridad',
      q3: 'Formación y concienciación de los empleados',
      q4: 'Comunicación y reporte de incidentes de seguridad',
      q5: 'Concienciación sobre amenazas (ej. phishing)',
    },
    procesos: {
      q1: 'Políticas internas de seguridad de la información',
      q2: 'Plan de respuesta a incidentes de ciberseguridad',
      q3: 'Copias de seguridad y recuperación de datos',
      q4: 'Cumplimiento de normativas y estándares de seguridad',
      q5: 'Evaluaciones de riesgo y auditorías de seguridad',
      q6: 'Plan de continuidad de negocio/recuperación ante desastres',
      q7: 'Control de accesos y gestión de cuentas de usuario',
    },
    tecnologias: {
      q1: 'Protección de la red (firewall y seguridad perimetral)',
      q2: 'Protección de los equipos (antivirus/antimalware)',
      q3: 'Actualización de sistemas y software (gestión de parches)',
      q4: 'Control de accesos y autenticación (contraseñas y 2FA)',
      q5: 'Protección de datos sensibles (cifrado)',
      q6: 'Monitorización y detección de amenazas',
      q7: 'Control de dispositivos y uso de equipos personales (BYOD)',
    },
  };
  
  // Check if we have the new structured format with questionsAndAnswers
  if (testData?.questionsAndAnswers) {
    // New format with question text
    ['personas', 'procesos', 'tecnologias'].forEach(section => {
      const sectionData = testData.questionsAndAnswers?.[section];
      if (sectionData) {
        sectionData.forEach((item) => {
          questionsAndAnswers.push({
            category: section.charAt(0).toUpperCase() + section.slice(1),
            questionId: item.id,
            question: item.question,
            answer: getAnswerLabel(typeof item.answer === 'number' ? item.answer : Number(item.answer)),
            score: typeof item.answer === 'number' ? item.answer : Number(item.answer),
            subcategory: item.category,
          });
        });
      }
    });
  } else {
    // Fallback to old format - reconstruct question text
    // Process personas section
    if (testData?.personas) {
      Object.entries(testData.personas).forEach(([key, value]) => {
        if (value) {
          questionsAndAnswers.push({
            category: 'Personas',
            questionId: key,
            question: QUESTION_TEXT.personas[key as keyof typeof QUESTION_TEXT.personas] || `Pregunta ${key}`,
            answer: getAnswerLabel(typeof value === 'number' ? value : Number(value)),
            score: typeof value === 'number' ? value : Number(value),
          });
        }
      });
    }
    
    // Process procesos section
    if (testData?.procesos) {
      Object.entries(testData.procesos).forEach(([key, value]) => {
        if (value) {
          questionsAndAnswers.push({
            category: 'Procesos',
            questionId: key,
            question: QUESTION_TEXT.procesos[key as keyof typeof QUESTION_TEXT.procesos] || `Pregunta ${key}`,
            answer: getAnswerLabel(typeof value === 'number' ? value : Number(value)),
            score: typeof value === 'number' ? value : Number(value),
          });
        }
      });
    }
    
    // Process tecnologias section
    if (testData?.tecnologias) {
      Object.entries(testData.tecnologias).forEach(([key, value]) => {
        if (value) {
          questionsAndAnswers.push({
            category: 'Tecnologías',
            questionId: key,
            question: QUESTION_TEXT.tecnologias[key as keyof typeof QUESTION_TEXT.tecnologias] || `Pregunta ${key}`,
            answer: getAnswerLabel(typeof value === 'number' ? value : Number(value)),
            score: typeof value === 'number' ? value : Number(value),
          });
        }
      });
    }
  }

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-4">
            <Link
              href={`/organizations/${slug}/assessments`}
              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold">Evaluación de Ciberseguridad</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(assessment.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>
          <PageActions>
            <div className="flex items-center gap-2">
              {getScoreBadge(assessment.scoreTotal ?? 0) && (
                <Badge className={getScoreBadge(assessment.scoreTotal ?? 0).color}>
                  {getScoreBadge(assessment.scoreTotal ?? 0).icon}
                  <span className="ml-1">{getScoreBadge(assessment.scoreTotal ?? 0).label}</span>
                </Badge>
              )}
              <Separator orientation="vertical" className="h-8" />
              <AssessmentPdfExport
                assessment={assessment}
                organizationSlug={slug}
                userName={session.user.name || 'Usuario'}
                userEmail={session.user.email || ''}
              />
              <Link
                href={`/organizations/${slug}/assessments/new`}
                className={buttonVariants({ variant: 'default' })}
              >
                Nueva Evaluación
              </Link>
            </div>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Score Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Puntuación</CardTitle>
              <CardDescription>
                Puntuación total: {assessment.scoreTotal}%
                {improvements && (
                  <span className={improvements.total >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {improvements.total >= 0 ? (
                      <><TrendingUp className="inline h-3 w-3" /> +{improvements.total}%</>
                    ) : (
                      <><TrendingDown className="inline h-3 w-3" /> {improvements.total}%</>
                    )}
                    vs. evaluación anterior
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Score by category */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Personas</span>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(assessment.scorePersonas ?? 0)}`}>
                        {assessment.scorePersonas}%
                      </span>
                    </div>
                    <Progress value={assessment.scorePersonas} className="h-2" />
                    {improvements && improvements.personas !== 0 && (
                      <p className={`text-xs ${improvements.personas > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {improvements.personas > 0 ? '+' : ''}{improvements.personas}% vs. anterior
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Procesos</span>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(assessment.scoreProcesos ?? 0)}`}>
                        {assessment.scoreProcesos}%
                      </span>
                    </div>
                    <Progress value={assessment.scoreProcesos} className="h-2" />
                    {improvements && improvements.procesos !== 0 && (
                      <p className={`text-xs ${improvements.procesos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {improvements.procesos > 0 ? '+' : ''}{improvements.procesos}% vs. anterior
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sistemas</span>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(assessment.scoreSistemas ?? 0)}`}>
                        {assessment.scoreSistemas}%
                      </span>
                    </div>
                    <Progress value={assessment.scoreSistemas} className="h-2" />
                    {improvements && improvements.sistemas !== 0 && (
                      <p className={`text-xs ${improvements.sistemas > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {improvements.sistemas > 0 ? '+' : ''}{improvements.sistemas}% vs. anterior
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Puntuación Total</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(assessment.scoreTotal ?? 0)}`}>
                      {assessment.scoreTotal}%
                    </span>
                  </div>
                  <Progress value={assessment.scoreTotal} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations Alert */}
          {recommendations.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">Recomendaciones de Mejora</AlertTitle>
                <AlertDescription className="mt-1">
                  Basado en tu evaluación, hemos identificado {recommendations.length} áreas con oportunidades de mejora.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Detailed Information Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Evaluación</CardTitle>
              <CardDescription>
                Revisa las respuestas y recomendaciones específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="questions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="questions">Preguntas y Respuestas</TabsTrigger>
                  <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                  <TabsTrigger value="metadata">Información</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-4 mt-4">
                  <AssessmentQuestionsAccordion questionsAndAnswers={questionsAndAnswers} />
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4 mt-4">
                  {recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <Card key={index} className={rec.priority === 'high' ? 'border-red-200 dark:border-red-900' : ''}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                {rec.icon}
                                {rec.category}
                              </CardTitle>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                                Prioridad {rec.priority === 'high' ? 'Alta' : 'Media'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {rec.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <span className="text-sm">{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <div>
                        <AlertTitle className="ml-6 mt-1">¡Excelente trabajo!</AlertTitle>
                        <AlertDescription className="mt-1">
                          Tu organización muestra un buen nivel de madurez en ciberseguridad. 
                          Continúa con las buenas prácticas y realiza evaluaciones periódicas.
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Fecha de evaluación</span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(assessment.createdAt), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>

                    {assessment.sector && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span className="text-sm font-medium">Sector</span>
                        </div>
                        <p className="text-sm">{assessment.sector}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">ID de evaluación</span>
                      </div>
                      <p className="text-sm font-mono">{assessment.id}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm font-medium">Evaluaciones totales</span>
                      </div>
                      <p className="text-sm">{previousAssessments.length} evaluaciones realizadas</p>
                    </div>
                  </div>

                  {previousAssessment && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Comparación con evaluación anterior</h4>
                        <p className="text-sm text-muted-foreground">
                          Evaluación del {format(new Date(previousAssessment.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <div className="grid gap-3 md:grid-cols-4 mt-3">
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm">Personas</span>
                            <span className={`text-sm font-bold ${improvements!.personas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvements!.personas >= 0 ? '+' : ''}{improvements!.personas}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm">Procesos</span>
                            <span className={`text-sm font-bold ${improvements!.procesos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvements!.procesos >= 0 ? '+' : ''}{improvements!.procesos}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="text-sm">Sistemas</span>
                            <span className={`text-sm font-bold ${improvements!.sistemas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvements!.sistemas >= 0 ? '+' : ''}{improvements!.sistemas}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg bg-primary/5">
                            <span className="text-sm font-medium">Total</span>
                            <span className={`text-sm font-bold ${improvements!.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {improvements!.total >= 0 ? '+' : ''}{improvements!.total}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}