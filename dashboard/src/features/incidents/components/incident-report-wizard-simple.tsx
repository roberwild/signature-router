'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceRequestModal } from '~/components/services/service-request-modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, 
  AlertTriangle, 
  Shield, 
  Users, 
  Database, 
  FileWarning,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  CheckCircle2,
  Circle,
  Info,
  User,
  Mail,
  CreditCard,
  Heart,
  Dna,
  Globe,
  Clock
} from 'lucide-react';

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
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Calendar } from '@workspace/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Progress } from '@workspace/ui/components/progress';

import { createIncident } from '~/actions/incidents/create-incident';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  incidentFormSchema,
  type IncidentFormValues,
  TIPO_INCIDENTE,
  CATEGORIA_DATOS,
  ESTADO_INCIDENTE
} from '~/schemas/incidents/incident-form-schema';

interface IncidentReportWizardProps {
  organizationId: string;
  organizationSlug: string;
  userId: string;
}

const WIZARD_STEPS = [
  {
    id: 'detection',
    title: 'Detección',
    description: 'Información inicial del incidente',
    icon: FileWarning,
  },
  {
    id: 'impact',
    title: 'Impacto',
    description: 'Evaluación de consecuencias',
    icon: AlertTriangle,
  },
  {
    id: 'mitigation',
    title: 'Mitigación',
    description: 'Medidas y contacto',
    icon: Shield,
  },
  {
    id: 'review',
    title: 'Revisión',
    description: 'Confirmar y enviar',
    icon: CheckCircle2,
  },
];

// Mapping of category icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  [CATEGORIA_DATOS.IDENTIFICATIVOS]: User,
  [CATEGORIA_DATOS.CONTACTO]: Mail,
  [CATEGORIA_DATOS.FINANCIEROS]: CreditCard,
  [CATEGORIA_DATOS.SALUD]: Heart,
  [CATEGORIA_DATOS.BIOMETRICOS]: Dna,
  [CATEGORIA_DATOS.OTRO]: Globe,
};

// Common timezones for Spanish organizations
const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'España (CET/CEST)' },
  { value: 'Atlantic/Canary', label: 'Canarias (WET/WEST)' },
  { value: 'Europe/London', label: 'Reino Unido (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Francia (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Alemania (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Italia (CET/CEST)' },
  { value: 'America/New_York', label: 'Nueva York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Mexico_City', label: 'México (CST/CDT)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (BRT)' },
  { value: 'Asia/Tokyo', label: 'Tokio (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'UTC', label: 'UTC (Tiempo Universal)' },
];

export function IncidentReportWizardSimple({ organizationSlug, organizationId, userId }: IncidentReportWizardProps) {
  const _router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [incidentToken, setIncidentToken] = useState<string | null>(null);
  const savingRef = useRef(false);
  
  const form = useZodForm({
    schema: incidentFormSchema,
    defaultValues: {
      deteccionAt: new Date(),
      deteccionHora: format(new Date(), 'HH:mm'),
      deteccionTimezone: 'none',
      estado: ESTADO_INCIDENTE.ABIERTO,
      notificadoAEPD: false,
      notificadoAfectados: false,
      nAfectadosAprox: 0,
      nRegistrosAprox: 0,
      categoriaDatos: [],
      descripcionBreve: '',
      consecuencias: '',
      medidasAdoptadas: '',
      pocNombre: '',
      pocEmail: '',
      pocTelefono: '',
    },
  });

  const watchNotificadoAEPD = form.watch('notificadoAEPD');
  const watchNotificadoAfectados = form.watch('notificadoAfectados');
  const watchDeteccionAt = form.watch('deteccionAt');
  const watchNotificadoAEPDAt = form.watch('notificadoAEPDAt');

  // Calculate if notification is delayed (>72 hours)
  const isDelayed = watchNotificadoAEPD && watchNotificadoAEPDAt && watchDeteccionAt &&
    ((watchNotificadoAEPDAt.getTime() - watchDeteccionAt.getTime()) / (1000 * 60 * 60)) > 72;

  // Manual save draft function
  const saveDraft = async () => {
    if (savingRef.current) return;
    
    savingRef.current = true;
    try {
      const formData = form.getValues();
      localStorage.setItem(`incident-draft-${organizationId}`, JSON.stringify(formData));
      setLastSaved(new Date());
      toast.success('Borrador guardado');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error al guardar borrador');
    } finally {
      savingRef.current = false;
    }
  };

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`incident-draft-${organizationId}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        // Convert date strings back to Date objects
        if (draftData.deteccionAt) draftData.deteccionAt = new Date(draftData.deteccionAt);
        if (draftData.notificadoAEPDAt) draftData.notificadoAEPDAt = new Date(draftData.notificadoAEPDAt);
        if (draftData.notificadoAfectadosAt) draftData.notificadoAfectadosAt = new Date(draftData.notificadoAfectadosAt);
        // Ensure optional fields have defaults
        if (!draftData.deteccionHora) draftData.deteccionHora = '';
        if (!draftData.deteccionTimezone) draftData.deteccionTimezone = 'none';
        
        form.reset(draftData);
        toast.info('Borrador recuperado');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [organizationId, form]);

  const onSubmit = async (values: IncidentFormValues) => {
    // Prevent double submission with multiple checks
    if (isSubmitting || incidentToken) {
      console.log('Submission blocked: isSubmitting =', isSubmitting, 'incidentToken =', incidentToken);
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('Starting incident submission...');
      const result = await createIncident(values);
      
      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        console.log('Incident created successfully:', result.data.token);
        // Clear draft on successful submission
        localStorage.removeItem(`incident-draft-${organizationId}`);
        // Store the incident token
        setIncidentToken(result.data.token);
        toast.success('Incidente registrado correctamente', {
          description: `Token de verificación: ${result.data.token}`,
        });
        // Don't redirect immediately - stay on review page
      }
    } catch (_error) {
      console.error('Error creating incident:', _error);
      toast.error('Error al registrar el incidente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof IncidentFormValues)[] = [];
    
    switch (currentStep) {
      case 0: // Detection step
        fieldsToValidate = ['deteccionAt', 'deteccionHora', 'deteccionTimezone', 'estado', 'tipoIncidente', 'descripcionBreve', 'categoriaDatos', 'nAfectadosAprox', 'nRegistrosAprox'];
        break;
      case 1: // Impact step
        fieldsToValidate = ['consecuencias'];
        break;
      case 2: // Mitigation step
        fieldsToValidate = ['medidasAdoptadas', 'pocNombre', 'pocEmail', 'pocTelefono'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 150)); // Brief delay for fade out
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setIsTransitioning(false), 150); // Fade in new content
    }
  };

  const prevStep = async () => {
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 150)); // Brief delay for fade out
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsTransitioning(false), 150); // Fade in new content
  };

  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <TooltipProvider>
      <FormProvider {...form}>
        <form 
          onSubmit={(e) => {
            if (isSubmitting || incidentToken) {
              e.preventDefault();
              return;
            }
            form.handleSubmit(onSubmit)(e);
          }} 
          className="space-y-6"
        >
          {/* Progress Indicator */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  {WIZARD_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex flex-col items-center space-y-2 flex-1",
                          index !== WIZARD_STEPS.length - 1 && "relative"
                        )}
                      >
                        {index !== WIZARD_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "absolute top-5 left-[50%] w-full h-0.5",
                              isCompleted ? "bg-primary" : "bg-muted"
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            isActive && "bg-primary text-primary-foreground",
                            isCompleted && "bg-primary text-primary-foreground",
                            !isActive && !isCompleted && "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            "text-sm font-medium",
                            isActive && "text-primary",
                            !isActive && !isCompleted && "text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="flex items-center justify-end space-x-2 text-sm text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>
                Guardado: {format(lastSaved, 'HH:mm:ss')}
              </span>
            </div>
          )}

          {/* Step Content */}
          <div 
            className={cn(
              "min-h-[500px] transition-opacity duration-300",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}
          >
            {currentStep === 0 && <StepDetection form={form} />}
            {currentStep === 1 && <StepImpact form={form} />}
            {currentStep === 2 && <StepMitigation form={form} watchNotificadoAEPD={watchNotificadoAEPD} watchNotificadoAfectados={watchNotificadoAfectados} isDelayed={isDelayed || false} />}
            {currentStep === 3 && (
              <StepReview 
                form={form} 
                isSubmitted={!!incidentToken}
                incidentToken={incidentToken}
                onRequestService={() => setShowServiceModal(true)}
                organizationSlug={organizationSlug}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveDraft}
                    disabled={savingRef.current}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Borrador
                  </Button>

                  {currentStep < WIZARD_STEPS.length - 1 ? (
                    <Button type="button" onClick={nextStep}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting || !!incidentToken}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Enviando...' : incidentToken ? 'Incidente Registrado' : 'Registrar Incidente'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </FormProvider>

      {/* Service Request Modal for Incident Response */}
      {showServiceModal && (
        <ServiceRequestModal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          service={{
            id: 'incident-response',
            title: 'Respuesta Rápida ante Incidentes'
          }}
          user={{
            id: userId,
            name: form.getValues('pocNombre') || '',
            email: form.getValues('pocEmail') || ''
          }}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          prefillMessage={incidentToken ? `Solicitud urgente de respuesta para el incidente con token: ${incidentToken}\n\nRequiero asistencia inmediata para contener y mitigar este incidente de seguridad.` : undefined}
        />
      )}
    </TooltipProvider>
  );
}

// Step 1: Detection and Identification
interface StepDetectionProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
}

function StepDetection({ form }: StepDetectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Identificación del Incidente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deteccionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fecha de detección *
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 ml-1 inline-block" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Día en que se detectó el incidente</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve existing time if it exists, otherwise set to current time
                            const existingTime = field.value || new Date();
                            const newDateTime = new Date(date);
                            newDateTime.setHours(existingTime.getHours());
                            newDateTime.setMinutes(existingTime.getMinutes());
                            field.onChange(newDateTime);
                          } else {
                            field.onChange(date);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado del incidente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ESTADO_INCIDENTE.ABIERTO}>Abierto</SelectItem>
                      <SelectItem value={ESTADO_INCIDENTE.INVESTIGACION}>En investigación</SelectItem>
                      <SelectItem value={ESTADO_INCIDENTE.CERRADO}>Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deteccionHora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Hora de detección
                    <span className="ml-1 text-xs text-muted-foreground">(Opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      {...field}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        field.onChange(timeValue);
                        
                        // Update the main deteccionAt field with the new time
                        const currentDate = form.getValues('deteccionAt') || new Date();
                        if (timeValue) {
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const newDateTime = new Date(currentDate);
                          newDateTime.setHours(hours, minutes);
                          form.setValue('deteccionAt', newDateTime);
                        }
                      }}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    HH:MM formato 24h
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deteccionTimezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Zona horaria
                    <span className="ml-1 text-xs text-muted-foreground">(Opcional)</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? '' : value);
                    }} 
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione zona horaria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No especificar</SelectItem>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Zona horaria donde ocurrió la detección
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="tipoIncidente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de incidente *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el tipo de incidente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TIPO_INCIDENTE.ACCESO_NO_AUTORIZADO}>Acceso no autorizado</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.MALWARE_RANSOMWARE}>Malware/Ransomware</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.PHISHING}>Phishing</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.PERDIDA_DISPOSITIVO}>Pérdida de dispositivo</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.FUGA_DATOS}>Fuga de datos</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.DISPONIBILIDAD}>Pérdida de disponibilidad</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.CONFIGURACION_ERRONEA}>Configuración errónea</SelectItem>
                  <SelectItem value={TIPO_INCIDENTE.OTRO}>Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcionBreve"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descripción breve del incidente *
                <span className="ml-2 text-xs text-muted-foreground">
                  ({field.value?.length || 0}/50 mín.)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa brevemente qué ocurrió, cómo se detectó y qué sistemas se vieron afectados..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Mínimo 50 caracteres. Sea conciso pero incluya los detalles relevantes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enhanced Data Categories Selection */}
        <FormField
          control={form.control}
          name="categoriaDatos"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <FormLabel>Categorías de datos afectados *</FormLabel>
                  <FormDescription className="mt-1">
                    Seleccione todas las categorías de datos personales comprometidas
                  </FormDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange(Object.values(CATEGORIA_DATOS))}
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => field.onChange([])}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {Object.entries(CATEGORIA_DATOS).map(([key, value]) => {
                  const isSelected = field.value?.includes(value) || false;
                  const Icon = CATEGORY_ICONS[value] || Database;
                  
                  return (
                    <label
                      key={`cat-${key}`}
                      htmlFor={`cat-checkbox-${key}`}
                      className={cn(
                        "relative flex items-start space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-colors group",
                        "hover:shadow-md hover:border-primary/50",
                        isSelected ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-accent/50"
                      )}
                    >
                      <div className="pt-0.5">
                        <Checkbox
                          id={`cat-checkbox-${key}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), value]);
                            } else {
                              field.onChange((field.value || []).filter((v: string) => v !== value));
                            }
                          }}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className={cn(
                            "h-4 w-4 transition-colors",
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )} />
                          <span className="text-sm font-medium capitalize select-none">
                            {value.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary absolute -top-2 -right-2 bg-background rounded-full" />
                      )}
                    </label>
                  );
                })}
              </div>
              
              {field.value?.length > 0 && (
                <div className="mt-3 p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    {field.value.length} categoría{field.value.length !== 1 ? 's' : ''} seleccionada{field.value.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nAfectadosAprox"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Número aproximado de afectados *
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={field.value === 0 ? '' : field.value}
                    onChange={e => {
                      const value = e.target.value;
                      // Only allow numeric input
                      if (value === '' || /^\d+$/.test(value)) {
                        field.onChange(value === '' ? 0 : parseInt(value, 10));
                      }
                    }}
                    placeholder="0"
                  />
                </FormControl>
                <FormDescription>
                  Personas cuyos datos se han visto comprometidos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nRegistrosAprox"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Número aproximado de registros *
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={field.value === 0 ? '' : field.value}
                    onChange={e => {
                      const value = e.target.value;
                      // Only allow numeric input
                      if (value === '' || /^\d+$/.test(value)) {
                        field.onChange(value === '' ? 0 : parseInt(value, 10));
                      }
                    }}
                    placeholder="0"
                  />
                </FormControl>
                <FormDescription>
                  Total de registros de datos afectados
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2: Impact Assessment
interface StepImpactProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
}

function StepImpact({ form }: StepImpactProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Evaluación del Impacto
        </CardTitle>
        <CardDescription>
          Analice las consecuencias y riesgos del incidente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="consecuencias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Consecuencias del incidente *
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 ml-1 inline-block" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Describa el impacto en confidencialidad, integridad y disponibilidad de los datos</p>
                  </TooltipContent>
                </Tooltip>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa las consecuencias reales o potenciales del incidente..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Incluya impactos técnicos, operacionales y en los derechos de los afectados
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="riesgosProbables"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Riesgos probables para los afectados
                <Badge variant="outline" className="ml-2">Opcional</Badge>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa los riesgos para los derechos y libertades de las personas afectadas..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                P.ej.: suplantación de identidad, pérdidas económicas, daño reputacional, discriminación
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Risk Level Indicator */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="ml-6 mt-1">Evaluación de Riesgo</AlertTitle>
          <AlertDescription className="mt-1">
            Considere si este incidente supone un alto riesgo para los derechos y libertades de las personas físicas.
            En caso afirmativo, será necesario notificar a los afectados (Art. 34 RGPD).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Step 3: Mitigation and Contact
interface StepMitigationProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
  watchNotificadoAEPD: boolean;
  watchNotificadoAfectados: boolean;
  isDelayed: boolean;
}

function StepMitigation({ form, watchNotificadoAEPD, watchNotificadoAfectados, isDelayed }: StepMitigationProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Medidas de Mitigación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="medidasAdoptadas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medidas adoptadas *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describa las medidas técnicas y organizativas ya implementadas..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Incluya medidas inmediatas para contener y mitigar el incidente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medidasPrevistas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Medidas previstas
                  <Badge variant="outline" className="ml-2">Opcional</Badge>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describa las medidas adicionales planificadas..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Medidas a implementar para evitar incidentes similares
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Punto de Contacto (DPO)</CardTitle>
          <CardDescription>
            Datos del responsable para más información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pocNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del DPO o contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pocEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="dpo@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pocTelefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input placeholder="+34 600 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>
            Estado de las comunicaciones obligatorias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name="notificadoAEPD"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-medium cursor-pointer">
                    Notificado a la AEPD
                  </FormLabel>
                </FormItem>
              )}
            />

            {watchNotificadoAEPD && (
              <div className="space-y-4 pl-6">
                <FormField
                  control={form.control}
                  name="notificadoAEPDAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de notificación *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccione fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isDelayed && (
                  <FormField
                    control={form.control}
                    name="razonRetraso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Razón del retraso (más de 72 horas) *
                          <Badge variant="destructive" className="ml-2">Requerido</Badge>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explique por qué no fue posible notificar en el plazo de 72 horas..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name="notificadoAfectados"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-medium cursor-pointer">
                    Notificado a los afectados
                  </FormLabel>
                </FormItem>
              )}
            />

            {watchNotificadoAfectados && (
              <div className="pl-6">
                <FormField
                  control={form.control}
                  name="notificadoAfectadosAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de notificación *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccione fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Review and Submit
interface StepReviewProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
  isSubmitted: boolean;
  incidentToken: string | null;
  onRequestService: () => void;
  organizationSlug: string;
}

function StepReview({ form, isSubmitted, incidentToken, onRequestService, organizationSlug }: StepReviewProps) {
  const formValues = form.getValues();
  
  // If submission is complete, show success state with service upselling
  if (isSubmitted && incidentToken) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200 ml-6 mt-1">
            Incidente Registrado Exitosamente
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300 mt-1">
            Token de verificación: <code className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">{incidentToken}</code>
          </AlertDescription>
        </Alert>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Respuesta Rápida ante Incidentes
                </CardTitle>
                <CardDescription className="mt-2">
                  ¿Necesita ayuda inmediata con este incidente? Nuestro equipo de expertos puede intervenir de forma urgente.
                </CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">Urgente</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <span>Respuesta inmediata 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <span>Contención y mitigación de daños</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <span>Análisis forense profesional</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <span>Apoyo en cumplimiento normativo RGPD</span>
              </li>
            </ul>
            <Button 
              size="lg" 
              className="w-full"
              onClick={onRequestService}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Solicitar Respuesta de Emergencia
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={() => window.location.href = `/organizations/${organizationSlug}/incidents`}
          >
            Ver Todos los Incidentes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200 ml-6 mt-1">
          Revisión Final
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300 mt-1">
          Por favor, revise toda la información antes de enviar la notificación.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Incidente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fecha de detección</p>
              <p className="font-medium">
                {formValues.deteccionAt && format(formValues.deteccionAt, "PPP", { locale: es })}
                {formValues.deteccionHora && ` a las ${formValues.deteccionHora}`}
                {formValues.deteccionTimezone && formValues.deteccionTimezone !== 'none' && ` (${TIMEZONES.find(tz => tz.value === formValues.deteccionTimezone)?.label || formValues.deteccionTimezone})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de incidente</p>
              <p className="font-medium">{formValues.tipoIncidente}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Afectados</p>
              <p className="font-medium">{formValues.nAfectadosAprox} personas</p>
            </div>
            <div>
              <p className="text-muted-foreground">Registros</p>
              <p className="font-medium">{formValues.nRegistrosAprox} registros</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Descripción</p>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{formValues.descripcionBreve}</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Categorías de datos afectados</p>
            <div className="flex flex-wrap gap-2">
              {formValues.categoriaDatos?.map((cat: string, idx: number) => (
                <Badge key={`review-cat-${idx}`} variant="secondary">
                  {cat.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Estado de notificaciones</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {formValues.notificadoAEPD ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">AEPD</span>
              </div>
              <div className="flex items-center gap-2">
                {formValues.notificadoAfectados ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Afectados</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2">Punto de contacto</p>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p>{formValues.pocNombre}</p>
              <p>{formValues.pocEmail}</p>
              <p>{formValues.pocTelefono}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="ml-6 mt-1">Importante</AlertTitle>
        <AlertDescription className="mt-1">
          Al enviar este formulario, se generará un token único para consulta pública del incidente.
          La información marcada como privada no será accesible mediante este token.
        </AlertDescription>
      </Alert>
    </div>
  );
}