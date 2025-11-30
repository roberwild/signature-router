'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
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
import { Switch } from '@workspace/ui/components/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { cn } from '@workspace/ui/lib/utils';

// AEPD mandatory fields schema
const incidentFormSchema = z.object({
  fechaDeteccion: z.date({
    required_error: 'La fecha de detección es obligatoria',
  }),
  descripcion: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres',
  }),
  tipoIncidente: z.string().min(1, {
    message: 'El tipo de incidente es obligatorio',
  }),
  categoriasDatos: z.string().min(1, {
    message: 'Las categorías de datos afectados son obligatorias',
  }),
  numeroAfectados: z.number().min(0, {
    message: 'El número de afectados debe ser 0 o mayor',
  }),
  consecuencias: z.string().min(10, {
    message: 'Las consecuencias deben tener al menos 10 caracteres',
  }),
  medidasAdoptadas: z.string().min(10, {
    message: 'Las medidas adoptadas deben tener al menos 10 caracteres',
  }),
  fechaResolucion: z.date().optional(),
  notificadoAEPD: z.boolean().default(false),
  fechaNotificacionAEPD: z.date().optional(),
  notificadoAfectados: z.boolean().default(false),
  fechaNotificacionAfectados: z.date().optional(),
  notasInternas: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

// Incident types based on AEPD guidelines
const INCIDENT_TYPES = [
  'Pérdida de datos',
  'Robo de datos',
  'Acceso no autorizado',
  'Modificación no autorizada',
  'Divulgación no autorizada',
  'Ransomware',
  'Phishing',
  'Malware',
  'Error humano',
  'Fallo técnico',
  'Otro',
];

// Data categories based on RGPD
const DATA_CATEGORIES = [
  'Datos identificativos',
  'Datos de contacto',
  'Datos económicos y financieros',
  'Datos de salud',
  'Datos especialmente protegidos',
  'Datos de menores',
  'Datos laborales',
  'Datos académicos',
  'Otro',
];

interface IncidentFormProps {
  onSubmit: (values: IncidentFormValues) => Promise<void>;
  initialValues?: Partial<IncidentFormValues>;
  isEditing?: boolean;
}

export function IncidentForm({
  onSubmit,
  initialValues,
  isEditing = false,
}: IncidentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      fechaDeteccion: initialValues?.fechaDeteccion || new Date(),
      descripcion: initialValues?.descripcion || '',
      tipoIncidente: initialValues?.tipoIncidente || '',
      categoriasDatos: initialValues?.categoriasDatos || '',
      numeroAfectados: initialValues?.numeroAfectados || 0,
      consecuencias: initialValues?.consecuencias || '',
      medidasAdoptadas: initialValues?.medidasAdoptadas || '',
      fechaResolucion: initialValues?.fechaResolucion,
      notificadoAEPD: initialValues?.notificadoAEPD || false,
      fechaNotificacionAEPD: initialValues?.fechaNotificacionAEPD,
      notificadoAfectados: initialValues?.notificadoAfectados || false,
      fechaNotificacionAfectados: initialValues?.fechaNotificacionAfectados,
      notasInternas: initialValues?.notasInternas || '',
    },
  });

  const handleSubmit = async (values: IncidentFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchNotificadoAEPD = form.watch('notificadoAEPD');
  const watchNotificadoAfectados = form.watch('notificadoAfectados');

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Detection Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información del Incidente</h3>
          
          <FormField
            control={form.control}
            name="fechaDeteccion"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha y hora de detección *</FormLabel>
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
                          format(field.value, 'PPP HH:mm', { locale: es })
                        ) : (
                          <span>Selecciona fecha y hora</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha y hora en que se detectó el incidente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoIncidente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de incidente *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de incidente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción breve del incidente *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe brevemente qué ha ocurrido..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Affected Data */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Afectados</h3>
          
          <FormField
            control={form.control}
            name="categoriasDatos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría de datos afectados *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la categoría de datos" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATA_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tipo de datos personales afectados
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numeroAfectados"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número estimado de afectados *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Número aproximado de personas cuyos datos se han visto afectados
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Impact and Measures */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Impacto y Medidas</h3>
          
          <FormField
            control={form.control}
            name="consecuencias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consecuencias/Riesgos/Impactos *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe las posibles consecuencias, riesgos e impactos..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medidasAdoptadas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medidas adoptadas *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe las medidas tomadas para mitigar el incidente..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Acciones realizadas para contener y remediar el incidente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaResolucion"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de resolución (si aplica)</FormLabel>
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
                          format(field.value, 'PPP HH:mm', { locale: es })
                        ) : (
                          <span>Selecciona fecha y hora</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          
          <FormField
            control={form.control}
            name="notificadoAEPD"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Notificado a AEPD
                  </FormLabel>
                  <FormDescription>
                    ¿Se ha notificado el incidente a la AEPD?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchNotificadoAEPD && (
            <FormField
              control={form.control}
              name="fechaNotificacionAEPD"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de notificación a AEPD</FormLabel>
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
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Selecciona fecha</span>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="notificadoAfectados"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Notificado a afectados
                  </FormLabel>
                  <FormDescription>
                    ¿Se ha notificado a las personas afectadas?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchNotificadoAfectados && (
            <FormField
              control={form.control}
              name="fechaNotificacionAfectados"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de notificación a afectados</FormLabel>
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
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Selecciona fecha</span>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Internal Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notas Internas</h3>
          
          <FormField
            control={form.control}
            name="notasInternas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas internas (no públicas)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales que no se mostrarán en el portal público..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Estas notas son solo para uso interno y no aparecerán en el portal de verificación
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting
            ? 'Guardando...'
            : isEditing
            ? 'Actualizar Incidente'
            : 'Registrar Incidente'}
        </Button>
      </form>
    </FormProvider>
  );
}