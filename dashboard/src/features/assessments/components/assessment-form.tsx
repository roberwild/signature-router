'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@workspace/ui/components/sonner';
import { 
  ClipboardCheck, 
  Users, 
  BarChart3, 
  Shield, 
  Info,
  CheckCircle,
  Save,
  HelpCircle,
  Keyboard,
  RotateCcw,
  Loader2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useSurveyQuestions } from '~/src/features/assessments/hooks/use-survey-questions';
// Remove unused imports - we only import the types we actually use

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  FormProvider,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Progress } from '@workspace/ui/components/progress';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
// Removed direct import of assessmentService - now using API
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Input } from '@workspace/ui/components/input';
import { Checkbox } from '@workspace/ui/components/checkbox';

// Assessment questions schema matching backend structure
const assessmentFormSchema = z.object({
  // Personas (People) - 5 questions (IDs 1-5)
  personas: z.object({
    q1: z.number().min(1, 'Respuesta requerida').max(4), // Responsabilidad de ciberseguridad
    q2: z.number().min(1, 'Respuesta requerida').max(4), // Compromiso de la dirección
    q3: z.number().min(1, 'Respuesta requerida').max(4), // Formación y concienciación
    q4: z.number().min(1, 'Respuesta requerida').max(4), // Comunicación y reporte
    q5: z.number().min(1, 'Respuesta requerida').max(4), // Concienciación sobre amenazas
  }),
  
  // Procesos (Processes) - 7 questions (IDs 6-12)
  procesos: z.object({
    q1: z.number().min(1, 'Respuesta requerida').max(4), // Políticas internas
    q2: z.number().min(1, 'Respuesta requerida').max(4), // Plan de respuesta
    q3: z.number().min(1, 'Respuesta requerida').max(4), // Copias de seguridad
    q4: z.number().min(1, 'Respuesta requerida').max(4), // Cumplimiento normativas
    q5: z.number().min(1, 'Respuesta requerida').max(4), // Evaluaciones de riesgo
    q6: z.number().min(1, 'Respuesta requerida').max(4), // Plan de continuidad
    q7: z.number().min(1, 'Respuesta requerida').max(4), // Control de accesos
  }),
  
  // Tecnologias (Systems) - 7 questions (IDs 13-19)
  tecnologias: z.object({
    q1: z.number().min(1, 'Respuesta requerida').max(4), // Protección de red
    q2: z.number().min(1, 'Respuesta requerida').max(4), // Protección equipos
    q3: z.number().min(1, 'Respuesta requerida').max(4), // Actualización sistemas
    q4: z.number().min(1, 'Respuesta requerida').max(4), // Control accesos
    q5: z.number().min(1, 'Respuesta requerida').max(4), // Protección datos sensibles
    q6: z.number().min(1, 'Respuesta requerida').max(4), // Monitorización
    q7: z.number().min(1, 'Respuesta requerida').max(4), // Control dispositivos
  }),
  
  // Metadata questions
  empleados: z.string().min(1, 'Respuesta requerida'), // Question 20: Company size
  sector: z.string().min(1, 'Respuesta requerida'), // Question 21: Sector
  
  // User data (collected at the end like Miguel's implementation)
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  
  // GDPR consent
  dataTreatment: z.boolean().refine(val => val === true, {
    message: 'Debe aceptar el tratamiento de datos'
  }),
  marketing: z.boolean().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

// Create a type for valid form paths
type FormPath = keyof AssessmentFormValues |
  `personas.${'q1' | 'q2' | 'q3' | 'q4' | 'q5'}` |
  `procesos.${'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7'}` |
  `tecnologias.${'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7'}`;

interface AssessmentFormProps {
  organizationId: string;
  organizationSlug: string;
  userEmail: string;
  userName: string;
  userId: string;
}

// Question help tooltips for Miguel's questions
const QUESTION_HELP = {
  personas: {
    q1: 'Evalúe quién es responsable de la ciberseguridad en su empresa.',
    q2: 'Considere el nivel de involucramiento y apoyo de la dirección.',
    q3: 'Formación regular, concienciación sobre amenazas, buenas prácticas.',
    q4: 'Canal claro de comunicación, proceso de reporte, respuesta a incidentes.',
    q5: 'Capacidad de identificar phishing, malware, ingeniería social.',
  },
  procesos: {
    q1: 'Políticas documentadas, actualizadas, comunicadas y aplicadas.',
    q2: 'Plan de respuesta documentado, equipo definido, procedimientos claros.',
    q3: 'Frecuencia de backups, pruebas de restauración, almacenamiento seguro.',
    q4: 'Cumplimiento de RGPD, ISO 27001, ENS, PCI-DSS según aplique.',
    q5: 'Análisis de riesgos periódicos, auditorías internas/externas.',
    q6: 'Plan de continuidad, RTO/RPO definidos, pruebas regulares.',
    q7: 'Gestión de altas/bajas, principio de menor privilegio, revisión periódica.',
  },
  tecnologias: {
    q1: 'Firewall configurado, reglas actualizadas, segmentación de red.',
    q2: 'Antivirus/antimalware actualizado, gestión centralizada.',
    q3: 'Gestión de parches, actualizaciones de seguridad, proceso definido.',
    q4: 'Contraseñas robustas, 2FA/MFA, políticas de acceso.',
    q5: 'Cifrado de datos en reposo y tránsito, gestión de claves.',
    q6: 'SIEM, monitorización activa, detección de amenazas.',
    q7: 'Política BYOD, MDM, control de dispositivos personales.',
  },
};

// Question definitions matching Miguel's questionnaire
const QUESTIONS = {
  personas: [
    { id: 'q1', text: 'Responsabilidad de la ciberseguridad en la empresa:', category: 'Organización' },
    { id: 'q2', text: 'Compromiso de la dirección con la ciberseguridad:', category: 'Dirección' },
    { id: 'q3', text: 'Formación y concienciación de los empleados:', category: 'Formación' },
    { id: 'q4', text: 'Comunicación y reporte de incidentes de seguridad:', category: 'Comunicación' },
    { id: 'q5', text: 'Concienciación sobre amenazas (ej. phishing):', category: 'Concienciación' },
  ],
  procesos: [
    { id: 'q1', text: 'Políticas internas de seguridad de la información:', category: 'Políticas' },
    { id: 'q2', text: 'Plan de respuesta a incidentes de ciberseguridad:', category: 'Incidentes' },
    { id: 'q3', text: 'Copias de seguridad y recuperación de datos:', category: 'Backup' },
    { id: 'q4', text: 'Cumplimiento de normativas y estándares de seguridad:', category: 'Cumplimiento' },
    { id: 'q5', text: 'Evaluaciones de riesgo y auditorías de seguridad:', category: 'Riesgos' },
    { id: 'q6', text: 'Plan de continuidad de negocio/recuperación ante desastres:', category: 'Continuidad' },
    { id: 'q7', text: 'Control de accesos y gestión de cuentas de usuario:', category: 'Accesos' },
  ],
  tecnologias: [
    { id: 'q1', text: 'Protección de la red (firewall y seguridad perimetral):', category: 'Red' },
    { id: 'q2', text: 'Protección de los equipos (antivirus/antimalware):', category: 'Equipos' },
    { id: 'q3', text: 'Actualización de sistemas y software (gestión de parches):', category: 'Actualizaciones' },
    { id: 'q4', text: 'Control de accesos y autenticación (contraseñas y 2FA):', category: 'Autenticación' },
    { id: 'q5', text: 'Protección de datos sensibles (cifrado):', category: 'Cifrado' },
    { id: 'q6', text: 'Monitorización y detección de amenazas:', category: 'Monitorización' },
    { id: 'q7', text: 'Control de dispositivos y uso de equipos personales (BYOD):', category: 'Dispositivos' },
  ],
};

// Rating options matching backend's a/b/c/d system (mapped to 1/2/3/4)
const RATING_OPTIONS = [
  { 
    value: 1, 
    label: 'Básico', 
    description: 'No implementado o muy básico',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    radioColor: 'bg-red-500 dark:bg-red-400',
    icon: '⚠️'
  },
  { 
    value: 2, 
    label: 'Parcial', 
    description: 'Implementación inicial o parcial',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    radioColor: 'bg-orange-500 dark:bg-orange-400',
    icon: '🔶'
  },
  { 
    value: 3, 
    label: 'Aceptable', 
    description: 'Implementación adecuada',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    radioColor: 'bg-yellow-500 dark:bg-yellow-400',
    icon: '✓'
  },
  { 
    value: 4, 
    label: 'Completo', 
    description: 'Implementación completa y madura',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    radioColor: 'bg-green-500 dark:bg-green-400',
    icon: '✅'
  },
];

export function AssessmentForm({
  organizationId,
  organizationSlug,
  userEmail,
  userName,
  userId: _,
}: AssessmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState<'personas' | 'procesos' | 'tecnologias' | 'informacion'>('personas');
  const [_completedSections, setCompletedSections] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Fetch questions dynamically from backend
  const { questions: dynamicQuestions, loading: questionsLoading, error: questionsError, totalQuestions: _dynamicTotalQuestions, categoryCounts } = useSurveyQuestions();

  // Load saved data from localStorage
  const getStorageKey = useCallback(() => `assessment-draft-${organizationId}`, [organizationId]);
  
  const getInitialValues = () => {
    return {
      personas: {},
      procesos: {},
      tecnologias: {},
      empleados: '',
      sector: '',
      nombre: userName || '', // Pre-fill with authenticated user name
      email: userEmail || '', // Pre-fill with authenticated user email
      telefono: '', // Always defined as empty string
      dataTreatment: false,
      marketing: false,
    };
  };

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: getInitialValues(),
  });

  // Load saved data on mount (client-side only)
  // Skip loading if we have a 'fresh' parameter (after reset or submission)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we should skip loading saved data
    const shouldStartFresh = searchParams.get('fresh') === 'true';
    if (shouldStartFresh) {
      // Clear localStorage and don't load saved data
      localStorage.removeItem(getStorageKey());
      // Remove the 'fresh' parameter from URL without refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('fresh');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }
    
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastSaved) {
          setLastSaved(new Date(parsed.lastSaved));
        }
        if (parsed.data) {
          // Reset form with saved data
          form.reset(parsed.data);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [getStorageKey, form, searchParams]);

  // Section navigation
  const sections = [
    { key: 'personas', title: 'Personas', icon: Users, color: 'text-blue-600' },
    { key: 'procesos', title: 'Procesos', icon: BarChart3, color: 'text-green-600' },
    { key: 'tecnologias', title: 'Tecnologías', icon: Shield, color: 'text-purple-600' },
    { key: 'informacion', title: 'Información', icon: UserCheck, color: 'text-orange-600' },
  ] as const;

  // Calculate progress
  const watchedValues = form.watch();
  
  // Auto-save to localStorage
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        const dataToSave = {
          data: values,
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, getStorageKey]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle number keys 1-4 (Miguel's scale)
      if (e.key >= '1' && e.key <= '4') {
        const value = parseInt(e.key);
        
        // Find the currently focused question
        const activeElement = document.activeElement;
        const questionContainer = activeElement?.closest('[data-question-id]');
        
        if (questionContainer) {
          const questionId = questionContainer.getAttribute('data-question-id');
          const sectionKey = questionContainer.getAttribute('data-section');
          
          if (questionId && sectionKey) {
            // Set the value for the current question
            form.setValue(`${sectionKey}.${questionId}` as FormPath, value as number, {
              shouldValidate: true,
              shouldDirty: true,
            });
            
            // Move to next question
            const nextQuestion = questionContainer.nextElementSibling;
            if (nextQuestion) {
              const nextInput = nextQuestion.querySelector('input[type="radio"]');
              if (nextInput instanceof HTMLElement) {
                nextInput.focus();
              }
            }
          }
        }
      }
      
      // Hide keyboard hint after first use
      if (e.key >= '1' && e.key <= '4' && showKeyboardHint) {
        setShowKeyboardHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [form, showKeyboardHint]);

  // Check if information section is complete (required fields filled)
  const isInformationSectionComplete = () => {
    return (
      watchedValues.empleados &&
      watchedValues.sector &&
      watchedValues.nombre &&
      watchedValues.email &&
      watchedValues.dataTreatment === true
    );
  };

  // Calculate progress including all sections
  const totalQuestions = categoryCounts ? (categoryCounts.personas + categoryCounts.procesos + categoryCounts.tecnologias) : 19;
  const answeredQuestions = [
    ...Object.values(watchedValues.personas || {}),
    ...Object.values(watchedValues.procesos || {}),
    ...Object.values(watchedValues.tecnologias || {}),
  ].filter(Boolean).length;
  
  // Add information section completion to overall progress
  const questionnaireProgress = (answeredQuestions / totalQuestions) * 75; // 75% for questionnaire
  const informationProgress = isInformationSectionComplete() ? 25 : 0; // 25% for information section
  const progress = questionnaireProgress + informationProgress;

  // Calculate section progress using dynamic counts
  const getSectionProgress = (section: keyof typeof QUESTIONS) => {
    const sectionAnswers = Object.values(watchedValues[section] || {}).filter(Boolean);
    // Use dynamic question count if available
    const sectionQuestionCount = dynamicQuestions 
      ? dynamicQuestions[section]?.length || QUESTIONS[section].length
      : QUESTIONS[section].length;
    return (sectionAnswers.length / sectionQuestionCount) * 100;
  };

  // Calculate scores
  const calculateSectionScore = (sectionAnswers: Record<string, number>) => {
    const answers = Object.values(sectionAnswers).filter(Boolean);
    if (answers.length === 0) return 0;
    const sum = answers.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / (answers.length * 4)) * 100); // Miguel uses 1-4 scale
  };

  const onSubmit = async (values: AssessmentFormValues) => {
    setIsSubmitting(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Enviando evaluación...', {
      description: 'Por favor espere mientras procesamos su evaluación',
    });
    
    try {
      // Calculate scores for each section
      const personasScore = calculateSectionScore(values.personas);
      const procesosScore = calculateSectionScore(values.procesos);
      const tecnologiasScore = calculateSectionScore(values.tecnologias);
      const totalScore = Math.round((personasScore + procesosScore + tecnologiasScore) / 3);

      // Build structured questions and answers for viewer
      const structuredAnswers = {
        personas: [] as Array<{ id: string; question: string; category: string; answer: number }>,
        procesos: [] as Array<{ id: string; question: string; category: string; answer: number }>,
        tecnologias: [] as Array<{ id: string; question: string; category: string; answer: number }>,
      };

      // Process each section with question text
      Object.entries(values.personas).forEach(([questionId, answer]) => {
        const question = QUESTIONS.personas.find(q => q.id === questionId);
        if (question && answer) {
          structuredAnswers.personas.push({
            id: questionId,
            question: question.text,
            category: question.category,
            answer,
          });
        }
      });

      Object.entries(values.procesos).forEach(([questionId, answer]) => {
        const question = QUESTIONS.procesos.find(q => q.id === questionId);
        if (question && answer) {
          structuredAnswers.procesos.push({
            id: questionId,
            question: question.text,
            category: question.category,
            answer,
          });
        }
      });

      Object.entries(values.tecnologias).forEach(([questionId, answer]) => {
        const question = QUESTIONS.tecnologias.find(q => q.id === questionId);
        if (question && answer) {
          structuredAnswers.tecnologias.push({
            id: questionId,
            question: question.text,
            category: question.category,
            answer,
          });
        }
      });

      // Prepare assessment data for Minery API (matching Miguel's structure)
      const assessmentData = {
        personas: values.personas,
        procesos: values.procesos,
        tecnologias: values.tecnologias,
        empleados: values.empleados || 'b', // Default to 11-50 employees
        sector: values.sector || 'Tecnología', // Default sector
        // User data fields
        nombre: values.nombre,
        email: values.email,
        telefono: values.telefono || '',
        // GDPR consent
        dataTreatment: values.dataTreatment,
        marketing: values.marketing || false,
        // Scores for local tracking
        scores: {
          personas: personasScore,
          procesos: procesosScore,
          tecnologias: tecnologiasScore,
          total: totalScore,
        },
        // Include structured Q&A for viewer
        questionsAndAnswers: structuredAnswers,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          organizationId,
        },
      };

      // Submit to API
      console.log('📤 Submitting assessment to backend:', {
        organizationId,
        sector: 'general',
        assessmentDataKeys: Object.keys(assessmentData),
        scores: assessmentData.scores,
      });
      
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentData,
          sector: 'general', // This could be dynamic based on organization data
          organizationId, // Pass organizationId directly
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const result = await response.json();
      console.log('✅ Assessment submitted successfully:', result);

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Clear localStorage to remove saved draft after successful submission
      localStorage.removeItem(getStorageKey());
      
      // Reset the form to clear all answers
      form.reset(getInitialValues());
      setLastSaved(null);
      setCurrentSection('personas');
      setCompletedSections([]);
      
      // Show appropriate success message based on Minery API status
      if (result.mineryApiStatus === 'sent') {
        toast.success('Evaluación completada exitosamente', {
          description: `Su puntuación de madurez en ciberseguridad es del ${totalScore}%`,
          duration: 5000,
        });
      } else {
        toast.success('Evaluación guardada', {
          description: `Su puntuación es del ${totalScore}%. La evaluación ha sido guardada y será procesada en breve.`,
          duration: 6000,
        });
      }

      // Navigate to assessments page (or could navigate back to new assessment with fresh=true)
      // Option 1: Go to list
      router.push(`/organizations/${organizationSlug}/assessments`);
      // Option 2: Stay on form but fresh - uncomment if preferred
      // router.push(`/organizations/${organizationSlug}/assessments/new?fresh=true`);
    } catch (error) {
      console.error('Assessment submission error:', error);
      const _errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Dismiss loading toast if still active
      toast.dismiss(loadingToast);
      
      toast.error('No se pudo enviar la evaluación', {
        description: 'Por favor, inténtelo de nuevo. Si el problema persiste, contacte con soporte.',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSectionIndex = sections.findIndex(s => s.key === currentSection);

  const goToNextSection = () => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < sections.length) {
      // Start transition effect
      setIsTransitioning(true);
      
      // Smooth scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Set section with a slight delay for transition effect
      setTimeout(() => {
        setCurrentSection(sections[nextIndex].key);
        // End transition after content change
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    }
  };

  const goToPreviousSection = () => {
    const prevIndex = currentSectionIndex - 1;
    if (prevIndex >= 0) {
      // Start transition effect
      setIsTransitioning(true);
      
      // Smooth scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Set section with a slight delay for transition effect
      setTimeout(() => {
        setCurrentSection(sections[prevIndex].key);
        // End transition after content change
        setTimeout(() => setIsTransitioning(false), 300);
      }, 150);
    }
  };

  const renderQuestionSection = (sectionKey: 'personas' | 'procesos' | 'tecnologias') => {
    // Use dynamic questions if available, fallback to hardcoded
    const questions = dynamicQuestions 
      ? (sectionKey === 'tecnologias' ? dynamicQuestions.tecnologias : dynamicQuestions[sectionKey])
      : QUESTIONS[sectionKey as keyof typeof QUESTIONS];
    const sectionProgress = getSectionProgress(sectionKey);
    const Section = sections.find(s => s.key === sectionKey);
    
    if (!Section) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Section.icon className={`h-6 w-6 ${Section.color}`} />
              <div>
                <CardTitle className="text-xl">
                  {Section.title}
                  {sectionProgress === 100 && (
                    <CheckCircle className="inline ml-2 h-5 w-5 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  {questions.length || 0} preguntas sobre {Section.title.toLowerCase()}
                </CardDescription>
              </div>
            </div>
            <Badge variant={sectionProgress === 100 ? 'default' : 'secondary'}>
              {Math.round(sectionProgress)}% completado
            </Badge>
          </div>
          <Progress value={sectionProgress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((question, index) => (
            <FormField
              key={`${sectionKey}-${question.id}`}
              control={form.control}
              name={`${sectionKey}.${question.id}` as FormPath}
              render={({ field }) => (
                <FormItem className="space-y-4" data-question-id={question.id} data-section={sectionKey}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <FormLabel className="text-base font-medium leading-relaxed flex-1">
                          {'text' in question ? question.text : (question as { pregunta: string }).pregunta}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          {QUESTION_HELP[sectionKey as keyof typeof QUESTION_HELP]?.[question.id as keyof typeof QUESTION_HELP['personas']] && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{QUESTION_HELP[sectionKey as keyof typeof QUESTION_HELP]?.[question.id as keyof typeof QUESTION_HELP['personas']]}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Categoría: {'category' in question ? question.category : (question as { ambitoKey?: string }).ambitoKey || sectionKey}
                      </div>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            const intValue = parseInt(value);
                            field.onChange(intValue);
                          }}
                          value={field.value?.toString()}
                          className="grid grid-cols-1 gap-3"
                        >
                          {RATING_OPTIONS.map((option) => (
                            <label 
                              key={`${sectionKey}-${question.id}-${option.value}`}
                              htmlFor={`${sectionKey}-${question.id}-${option.value}`}
                              className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                field.value === option.value
                                  ? `${option.bgColor} ${option.borderColor} shadow-sm` 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                              }`}
                            >
                              <div className="relative">
                                <RadioGroupItem 
                                  value={option.value.toString()} 
                                  id={`${sectionKey}-${question.id}-${option.value}`}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  field.value === option.value
                                    ? `${option.borderColor} ${option.bgColor}` 
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                }`}>
                                  {field.value === option.value && (
                                    <div className={`w-2.5 h-2.5 rounded-full ${option.radioColor}`} />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <div className={`text-sm font-semibold ${
                                    field.value === option.value? option.color : 'text-gray-700 dark:text-gray-200'
                                  }`}>
                                    {option.label}
                                  </div>
                                  <p className={`text-xs mt-0.5 ${
                                    field.value === option.value
                                      ? 'text-gray-700 dark:text-gray-300' 
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {option.description}
                                  </p>
                                </div>
                                <span className="text-lg ml-2">{option.icon}</span>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </div>
                  {index < questions.length - 1 && <Separator className="mt-6" />}
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>
    );
  };

  // Show loading state while fetching questions
  if (questionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando preguntas del cuestionario...</p>
      </div>
    );
  }

  // Show error state if questions failed to load
  if (questionsError && !dynamicQuestions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <div>
          <AlertTitle className="ml-6 mt-1">Error al cargar el cuestionario</AlertTitle>
          <AlertDescription className="mt-1">
            {questionsError}. Por favor, intente recargar la página.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="fixed top-2 right-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-lg">
              <Save className="h-3 w-3" />
              <span>Borrador guardado {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
          
          {/* Keyboard hint */}
          {showKeyboardHint && (
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <Keyboard className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">Navegación rápida</AlertTitle>
                <AlertDescription className="mt-1">
                  Usa las teclas 1-4 para responder rápidamente las preguntas
                </AlertDescription>
              </div>
            </Alert>
          )}
        {/* Progress Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Evaluación de Ciberseguridad</CardTitle>
                  <CardDescription>
                    {answeredQuestions} de {totalQuestions} preguntas completadas{isInformationSectionComplete() ? ' + información personal' : ''}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                  {Math.round(progress)}% completado
                </Badge>
                {/* Reset Dialog */}
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Reiniciar cuestionario">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>¿Reiniciar el cuestionario?</DialogTitle>
                      <DialogDescription>
                        Esta acción eliminará todas las respuestas guardadas y reiniciará el cuestionario desde el principio. Esta acción no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setResetDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          // Clear localStorage
                          localStorage.removeItem(getStorageKey());
                          // Reset form to initial empty state
                          form.reset(getInitialValues());
                          // Clear all state
                          setLastSaved(null);
                          setCurrentSection('personas');
                          setCompletedSections([]);
                          setResetDialogOpen(false);
                          // Scroll to top
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          toast.success('Cuestionario reiniciado correctamente');
                        }}
                      >
                        Reiniciar cuestionario
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
              {sections.map((section) => {
                const sectionProgress = section.key === 'informacion'
                  ? (isInformationSectionComplete() ? 100 : 0)
                  : getSectionProgress(section.key);
                const isActive = currentSection === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => {
                      // Start transition effect
                      setIsTransitioning(true);

                      // Smooth scroll to top when switching sections
                      window.scrollTo({ top: 0, behavior: 'smooth' });

                      // Set section with a slight delay for transition effect
                      setTimeout(() => {
                        setCurrentSection(section.key);
                        // End transition after content change
                        setTimeout(() => setIsTransitioning(false), 300);
                      }, 150);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border transition-colors min-w-[120px] sm:min-w-[140px] ${
                      isActive ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                    }`}
                  >
                    <section.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${isActive ? section.color : 'text-muted-foreground'}`} />
                    <span className={`font-medium text-sm sm:text-base text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {section.title}
                    </span>
                    <div className="w-12 sm:w-16">
                      <Progress value={sectionProgress} className="h-1" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(sectionProgress)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Information Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <div>
            <AlertTitle className="ml-6 mt-1">Instrucciones</AlertTitle>
            <AlertDescription className="mt-1">
              Evalúe cada aspecto de su organización seleccionando la opción (a, b, c o d) que mejor describa su situación actual.
              Sea honesto en sus respuestas para obtener una evaluación precisa de su nivel de ciberseguridad.
            </AlertDescription>
          </div>
        </Alert>

        {/* Current Section */}
        {currentSection !== 'informacion' && (
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}`}>
            {renderQuestionSection(currentSection)}
          </div>
        )}

        {/* Information Section - Show only on information section */}
        {currentSection === 'informacion' && (
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                  <div>
                    <CardTitle className="text-xl">
                      Información Adicional
                    </CardTitle>
                    <CardDescription>
                      Estos datos nos ayudan a personalizar su evaluación
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Size Question (ID 20) */}
                <FormField
                  control={form.control}
                  name="empleados"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿Cuántos empleados tiene tu empresa?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tamaño de su empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="a">0-10 empleados</SelectItem>
                          <SelectItem value="b">11-50 empleados</SelectItem>
                          <SelectItem value="c">51-250 empleados</SelectItem>
                          <SelectItem value="d">Más de 250 empleados</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sector Question (ID 21) */}
                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>¿A qué se dedica tu empresa?</FormLabel>
                      <FormDescription>
                        Dependiendo del sector, los riesgos en ciberseguridad pueden variar
                      </FormDescription>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value || ''} // Ensure value is never undefined
                          placeholder="Ej: Tecnología, Finanzas, Salud, Manufactura, etc."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Data Section */}
                <Separator className="my-6" />
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Para enviarle los resultados detallados de su evaluación
                    </p>
                  </div>

                  {/* Name field */}
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ''} // Ensure value is never undefined
                            placeholder="Juan Pérez"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email profesional *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ''} // Ensure value is never undefined
                            type="email"
                            placeholder="juan.perez@empresa.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone field */}
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ''} // Ensure value is never undefined
                            type="tel"
                            placeholder="+34 600 000 000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* GDPR Consent */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Consentimiento</h3>
                    
                    {/* Data treatment consent */}
                    <FormField
                      control={form.control}
                      name="dataTreatment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Acepto el tratamiento de mis datos personales *
                            </FormLabel>
                            <FormDescription>
                              Sus datos serán tratados de acuerdo con nuestra política de privacidad
                              para proporcionarle los resultados de la evaluación.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Marketing consent */}
                    <FormField
                      control={form.control}
                      name="marketing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Deseo recibir información sobre ciberseguridad
                            </FormLabel>
                            <FormDescription>
                              Recibirá consejos, actualizaciones y recursos sobre ciberseguridad empresarial.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousSection}
            disabled={currentSectionIndex === 0}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Atrás</span>
          </Button>

          <div className="flex gap-2 order-1 sm:order-2">
            {sections.map((section, index) => (
              <div
                key={section.key}
                className={`w-3 h-3 rounded-full ${
                  index === currentSectionIndex
                    ? 'bg-primary'
                    : index < currentSectionIndex
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {currentSectionIndex === sections.length - 1 ? (
            <Button
              type="submit"
              disabled={isSubmitting || !isInformationSectionComplete()}
              className="w-full sm:w-auto order-3"
            >
              <span className="hidden sm:inline">
                {isSubmitting ? 'Enviando evaluación...' : 'Finalizar evaluación'}
              </span>
              <span className="sm:hidden">
                {isSubmitting ? 'Enviando...' : 'Finalizar'}
              </span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goToNextSection}
              disabled={currentSection !== 'informacion' ? getSectionProgress(currentSection) < 100 : false}
              className="w-full sm:w-auto order-3"
            >
              Siguiente
            </Button>
          )}
        </div>
        </form>
      </FormProvider>
    </TooltipProvider>
  );
}