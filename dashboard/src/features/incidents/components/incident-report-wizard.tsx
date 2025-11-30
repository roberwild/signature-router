'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Info
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';

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

// Template definitions for common incidents
const INCIDENT_TEMPLATES = {
  ransomware: {
    tipoIncidente: TIPO_INCIDENTE.MALWARE_RANSOMWARE,
    descripcionBreve: 'Ataque de ransomware detectado en sistemas de la organización. Los archivos han sido cifrados y se solicita rescate para su recuperación.',
    consecuencias: 'Pérdida de disponibilidad de datos. Posible pérdida permanente si no hay backups. Interrupción de servicios.',
    medidasAdoptadas: 'Aislamiento de sistemas afectados. Activación del plan de respuesta a incidentes. Evaluación de backups disponibles.',
    categoriaDatos: [CATEGORIA_DATOS.IDENTIFICATIVOS, CATEGORIA_DATOS.CONTACTO],
  },
  dataLeak: {
    tipoIncidente: TIPO_INCIDENTE.FUGA_DATOS,
    descripcionBreve: 'Exposición no autorizada de datos personales debido a configuración incorrecta de permisos.',
    consecuencias: 'Pérdida de confidencialidad. Posible uso indebido de datos personales por terceros.',
    medidasAdoptadas: 'Corrección inmediata de permisos. Auditoría de accesos. Identificación de datos expuestos.',
    categoriaDatos: [CATEGORIA_DATOS.IDENTIFICATIVOS, CATEGORIA_DATOS.CONTACTO, CATEGORIA_DATOS.FINANCIEROS],
  },
  phishing: {
    tipoIncidente: TIPO_INCIDENTE.PHISHING,
    descripcionBreve: 'Empleado víctima de ataque de phishing, credenciales comprometidas.',
    consecuencias: 'Posible acceso no autorizado a sistemas. Riesgo de exfiltración de datos.',
    medidasAdoptadas: 'Reseteo inmediato de credenciales. Revisión de logs de acceso. Formación adicional al personal.',
    categoriaDatos: [CATEGORIA_DATOS.IDENTIFICATIVOS],
  },
};

// Data category groups for better organization
const DATA_CATEGORY_GROUPS = {
  basic: {
    label: 'Datos Básicos',
    items: [
      { value: CATEGORIA_DATOS.IDENTIFICATIVOS, label: 'Identificación', icon: '🆔' },
      { value: CATEGORIA_DATOS.CONTACTO, label: 'Contacto', icon: '📧' },
      { value: CATEGORIA_DATOS.FINANCIEROS, label: 'Económicos', icon: '💳' },
    ],
  },
  sensitive: {
    label: 'Datos Sensibles',
    items: [
      { value: CATEGORIA_DATOS.SALUD, label: 'Salud', icon: '🏥' },
      { value: CATEGORIA_DATOS.BIOMETRICOS, label: 'Biométricos', icon: '👤' },
    ],
  },
};

export function IncidentReportWizard({ organizationSlug, organizationId, userId: _ }: IncidentReportWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const isDraftSavingRef = useRef(false);
  
  const form = useZodForm({
    schema: incidentFormSchema,
    defaultValues: {
      deteccionAt: new Date(),
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

  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    if (isDraftSavingRef.current) return; // Prevent concurrent saves
    
    isDraftSavingRef.current = true;
    try {
      const formData = form.getValues();
      // Store in localStorage for now - could be an API call
      localStorage.setItem(`incident-draft-${organizationId}`, JSON.stringify(formData));
      setLastSaved(new Date());
      // Don't show toast on auto-save to avoid spam
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      isDraftSavingRef.current = false;
    }
  }, [organizationId, form]);

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
        
        form.reset(draftData);
        toast.info('Borrador recuperado');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [organizationId, form]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && !isDraftSavingRef.current) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [saveDraft, form.formState.isDirty]);

  const applyTemplate = (templateKey: keyof typeof INCIDENT_TEMPLATES) => {
    const template = INCIDENT_TEMPLATES[templateKey];
    
    // Apply template values without triggering re-renders
    if (template.tipoIncidente) {
      form.setValue('tipoIncidente', template.tipoIncidente);
    }
    if (template.descripcionBreve) {
      form.setValue('descripcionBreve', template.descripcionBreve);
    }
    if (template.consecuencias) {
      form.setValue('consecuencias', template.consecuencias);
    }
    if (template.medidasAdoptadas) {
      form.setValue('medidasAdoptadas', template.medidasAdoptadas);
    }
    if (template.categoriaDatos) {
      form.setValue('categoriaDatos', template.categoriaDatos);
    }
    
    setShowTemplates(false);
    toast.success('Plantilla aplicada');
  };

  const onSubmit = async (values: IncidentFormValues) => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        const result = await createIncident(values);
        
        if (result?.serverError) {
          toast.error(result.serverError);
        } else if (result?.data) {
          // Clear draft on successful submission
          localStorage.removeItem(`incident-draft-${organizationId}`);
          toast.success('Incidente registrado correctamente', {
            description: `Token de verificación: ${result.data.token}`,
          });
          router.push(`/organizations/${organizationSlug}/incidents`);
        }
      } catch (_error) {
        toast.error('Error al registrar el incidente');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof IncidentFormValues)[] = [];
    
    switch (currentStep) {
      case 0: // Detection step
        fieldsToValidate = ['deteccionAt', 'estado', 'tipoIncidente', 'descripcionBreve', 'categoriaDatos', 'nAfectadosAprox', 'nRegistrosAprox'];
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
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepDetection form={form} showTemplates={showTemplates} setShowTemplates={setShowTemplates} applyTemplate={applyTemplate} />;
      case 1:
        return <StepImpact form={form} />;
      case 2:
        return <StepMitigation form={form} watchNotificadoAEPD={watchNotificadoAEPD} watchNotificadoAfectados={watchNotificadoAfectados} isDelayed={isDelayed || false} />;
      case 3:
        return <StepReview form={form} />;
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  return (
    <TooltipProvider>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                Guardado automáticamente {format(lastSaved, 'HH:mm:ss')}
              </span>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[500px]">
            {getStepContent()}
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
                    onClick={async () => {
                      await saveDraft();
                      toast.success('Borrador guardado');
                    }}
                    disabled={isDraftSavingRef.current}
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
                    <Button type="submit" disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Enviando...' : 'Registrar Incidente'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </FormProvider>
    </TooltipProvider>
  );
}

// Step 1: Detection and Identification
interface StepDetectionProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
  showTemplates: boolean;
  setShowTemplates: (show: boolean) => void;
  applyTemplate: (template: keyof typeof INCIDENT_TEMPLATES) => void;
}

function StepDetection({ form, showTemplates, setShowTemplates, applyTemplate }: StepDetectionProps) {
  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plantillas Rápidas</CardTitle>
          <CardDescription>
            Use una plantilla para prellenar campos comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible open={showTemplates} onOpenChange={setShowTemplates}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                {showTemplates ? 'Ocultar' : 'Mostrar'} Plantillas
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyTemplate('ransomware');
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">Ransomware</p>
                    <p className="text-xs text-muted-foreground">Ataque de cifrado</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyTemplate('dataLeak');
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">Fuga de Datos</p>
                    <p className="text-xs text-muted-foreground">Exposición no autorizada</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyTemplate('phishing');
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">Phishing</p>
                    <p className="text-xs text-muted-foreground">Credenciales comprometidas</p>
                  </div>
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Identificación del Incidente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deteccionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fecha y hora de detección *
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 ml-1 inline-block" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Momento en que se detectó el incidente</p>
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
                            format(field.value, "PPP 'a las' HH:mm", { locale: es })
                          ) : (
                            <span>Seleccione fecha y hora</span>
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
                <div className="flex items-center justify-between">
                  <FormLabel>Categorías de datos afectados *</FormLabel>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => field.onChange(Object.values(CATEGORIA_DATOS))}
                    >
                      Seleccionar todos
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
                <FormDescription>
                  Seleccione todas las categorías de datos personales comprometidas
                </FormDescription>
                
                <div className="space-y-4 mt-4">
                  {Object.entries(DATA_CATEGORY_GROUPS).map(([groupKey, group]) => (
                    <div key={`group-${groupKey}`} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{group.label}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {group.items.map((item, idx) => (
                          <FormItem
                            key={`${groupKey}-${item.value}-${idx}`}
                            className="flex items-center space-x-2 space-y-0 border rounded-lg p-3 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              const updatedValue = field.value?.includes(item.value)
                                ? field.value.filter((v: string) => v !== item.value)
                                : [...(field.value || []), item.value];
                              field.onChange(updatedValue);
                            }}
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.value)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...(field.value || []), item.value]
                                    : field.value?.filter((v: string) => v !== item.value) || [];
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="flex items-center gap-2 cursor-pointer">
                              <span>{item.icon}</span>
                              <span className="text-sm font-normal">{item.label}</span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {field.value?.length > 0 && (
                  <div className="mt-3 p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">
                      {field.value.length} categoría(s) seleccionada(s)
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
                      type="number"
                      min="0"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                      type="number"
                      min="0"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
    </div>
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
          <div>
            <AlertTitle className="ml-6 mt-1">Evaluación de Riesgo</AlertTitle>
            <AlertDescription className="mt-1">
              Considere si este incidente supone un alto riesgo para los derechos y libertades de las personas físicas.
              En caso afirmativo, será necesario notificar a los afectados (Art. 34 RGPD).
            </AlertDescription>
          </div>
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
          <Collapsible>
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

              <CollapsibleContent>
                {watchNotificadoAEPD && (
                  <div className="space-y-4 pl-6">
                    <FormField
                      control={form.control}
                      name="notificadoAEPDAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha y hora de notificación *</FormLabel>
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
                                    format(field.value, "PPP 'a las' HH:mm", { locale: es })
                                  ) : (
                                    <span>Seleccione fecha y hora</span>
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
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Collapsible>
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

              <CollapsibleContent>
                {watchNotificadoAfectados && (
                  <div className="pl-6">
                    <FormField
                      control={form.control}
                      name="notificadoAfectadosAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha y hora de notificación *</FormLabel>
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
                                    format(field.value, "PPP 'a las' HH:mm", { locale: es })
                                  ) : (
                                    <span>Seleccione fecha y hora</span>
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
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Privada</CardTitle>
          <CardDescription>
            Esta información NO se mostrará en la consulta pública
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="privadoNotas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Notas internas
                  <Badge variant="outline" className="ml-2">Opcional</Badge>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalles técnicos, IOCs, información sensible que no debe ser pública..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Use este campo para documentación interna del equipo de seguridad
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: Review and Submit
interface StepReviewProps {
  form: ReturnType<typeof useZodForm<typeof incidentFormSchema>>;
}

function StepReview({ form }: StepReviewProps) {
  const formValues = form.getValues();
  
  return (
    <div className="space-y-6">
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          Revisión Final
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
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
                {formValues.deteccionAt && format(formValues.deteccionAt, "PPP 'a las' HH:mm", { locale: es })}
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
                <Badge key={`cat-${cat}-${idx}`} variant="secondary">
                  {cat.replace('_', ' ')}
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
        <div>
          <AlertTitle className="ml-6 mt-1">Importante</AlertTitle>
          <AlertDescription className="mt-1">
            Al enviar este formulario, se generará un token único para consulta pública del incidente.
            La información marcada como privada no será accesible mediante este token.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}