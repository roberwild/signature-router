'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, Info } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';

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
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';

// Schema según RGPD Art. 33
const incidentFormSchema = z.object({
  // Información temporal (Art. 33.1)
  fechaDeteccion: z.date({
    required_error: 'La fecha de detección es obligatoria',
  }),
  horaDeteccion: z.string().min(1, 'La hora de detección es obligatoria'),
  fechaIncidente: z.date().optional(),
  horaIncidente: z.string().optional(),
  notificadoEn72Horas: z.boolean(),
  motivoRetraso: z.string().optional(),

  // Naturaleza de la violación (Art. 33.3.a)
  tipoIncidente: z.enum([
    'CONFIDENCIALIDAD', // Acceso no autorizado
    'INTEGRIDAD',       // Alteración no autorizada
    'DISPONIBILIDAD',   // Pérdida de acceso
    'MULTIPLE'          // Combinación
  ], {
    required_error: 'Debe seleccionar el tipo de incidente',
  }),
  descripcion: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  
  // Categorías y volumen (Art. 33.3.a)
  categoriasAfectados: z.array(z.enum([
    'EMPLEADOS',
    'CLIENTES',
    'PROVEEDORES',
    'USUARIOS_WEB',
    'MENORES',
    'OTROS'
  ])).min(1, 'Debe seleccionar al menos una categoría'),
  numeroAfectados: z.number().min(0, 'El número debe ser positivo'),
  numeroAfectadosAproximado: z.boolean(),
  
  categoriasDatos: z.array(z.enum([
    'IDENTIFICACION',    // Nombre, DNI, etc.
    'CONTACTO',         // Email, teléfono, dirección
    'ECONOMICOS',       // Datos bancarios, financieros
    'SALUD',           // Datos médicos (categoría especial)
    'VIDA_SEXUAL',     // Categoría especial
    'ORIGEN_RACIAL',   // Categoría especial
    'OPINIONES_POLITICAS', // Categoría especial
    'CREENCIAS_RELIGIOSAS', // Categoría especial
    'AFILIACION_SINDICAL',  // Categoría especial
    'DATOS_GENETICOS',     // Categoría especial
    'DATOS_BIOMETRICOS',   // Categoría especial
    'OTROS'
  ])).min(1, 'Debe seleccionar al menos una categoría de datos'),
  numeroRegistros: z.number().min(0, 'El número debe ser positivo'),
  numeroRegistrosAproximado: z.boolean(),

  // Contacto DPO (Art. 33.3.b)
  nombreContacto: z.string().min(1, 'El nombre de contacto es obligatorio'),
  emailContacto: z.string().email('Email inválido'),
  telefonoContacto: z.string().min(9, 'Teléfono inválido'),
  esDPO: z.boolean(),

  // Consecuencias probables (Art. 33.3.c)
  consecuencias: z.string().min(50, 'Debe describir las consecuencias probables (mín. 50 caracteres)'),
  riesgoDerechos: z.enum([
    'BAJO',
    'MEDIO',
    'ALTO',
    'MUY_ALTO'
  ], {
    required_error: 'Debe evaluar el nivel de riesgo',
  }),

  // Medidas adoptadas (Art. 33.3.d)
  medidasAdoptadas: z.string().min(50, 'Debe describir las medidas adoptadas (mín. 50 caracteres)'),
  medidasPropuestas: z.string().optional(),
  
  // Notificaciones
  notificadoAEPD: z.boolean(),
  fechaNotificacionAEPD: z.date().optional(),
  numeroReferenciaAEPD: z.string().optional(),
  notificadoAfectados: z.boolean(),
  fechaNotificacionAfectados: z.date().optional(),
  formaNotificacionAfectados: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

interface IncidentReportFormProps {
  organizationId: string;
  organizationSlug: string;
  userId: string;
}

export function IncidentReportForm({ organizationId, organizationSlug, userId }: IncidentReportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      fechaDeteccion: new Date(),
      horaDeteccion: format(new Date(), 'HH:mm'),
      notificadoEn72Horas: true,
      numeroAfectadosAproximado: true,
      numeroRegistrosAproximado: true,
      categoriasAfectados: [],
      categoriasDatos: [],
      numeroAfectados: 0,
      numeroRegistros: 0,
      esDPO: false,
      notificadoAEPD: false,
      notificadoAfectados: false,
    },
  });

  const notificadoEn72Horas = form.watch('notificadoEn72Horas');
  const notificadoAEPD = form.watch('notificadoAEPD');
  const notificadoAfectados = form.watch('notificadoAfectados');

  async function onSubmit(values: IncidentFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          userId,
          ...values,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el incidente');
      }

      const result = await response.json();
      
      toast.success('Incidente reportado correctamente', {
        description: `Token de verificación: ${result.token}`,
      });

      router.push(`/organizations/${organizationSlug}/incidents`);
    } catch (_error) {
      toast.error('Error al reportar el incidente', {
        description: 'Por favor, inténtelo de nuevo',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Alerta 72 horas */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Plazo de notificación: 72 horas</AlertTitle>
          <AlertDescription>
            La notificación debe realizarse sin dilación indebida y, cuando sea posible, 
            dentro de las 72 horas posteriores a tener conocimiento del incidente.
          </AlertDescription>
        </Alert>

        {/* Sección 1: Información temporal */}
        <Card>
          <CardHeader>
            <CardTitle>1. Información Temporal</CardTitle>
            <CardDescription>
              Datos sobre cuándo se detectó y ocurrió el incidente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaDeteccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de detección *</FormLabel>
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

              <FormField
                control={form.control}
                name="horaDeteccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de detección *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaIncidente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del incidente (si es diferente)</FormLabel>
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

              <FormField
                control={form.control}
                name="horaIncidente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora del incidente</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notificadoEn72Horas"
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
                      Notificación dentro de las 72 horas
                    </FormLabel>
                    <FormDescription>
                      ¿Se está notificando dentro del plazo de 72 horas desde la detección?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!notificadoEn72Horas && (
              <FormField
                control={form.control}
                name="motivoRetraso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del retraso *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explique los motivos del retraso en la notificación..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Según el Art. 33.1, debe acompañar los motivos del retraso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Sección 2: Naturaleza del incidente (Art. 33.3.a) */}
        <Card>
          <CardHeader>
            <CardTitle>2. Naturaleza de la Violación</CardTitle>
            <CardDescription>
              Descripción de la naturaleza de la violación de datos personales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="tipoIncidente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de incidente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de incidente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CONFIDENCIALIDAD">
                        Violación de confidencialidad (acceso no autorizado)
                      </SelectItem>
                      <SelectItem value="INTEGRIDAD">
                        Violación de integridad (alteración no autorizada)
                      </SelectItem>
                      <SelectItem value="DISPONIBILIDAD">
                        Violación de disponibilidad (pérdida de acceso/destrucción)
                      </SelectItem>
                      <SelectItem value="MULTIPLE">
                        Múltiple (combinación de las anteriores)
                      </SelectItem>
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
                  <FormLabel>Descripción detallada del incidente *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa qué ocurrió, cómo se detectó, qué sistemas se vieron afectados..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 50 caracteres. Sea lo más específico posible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección 3: Categorías y número de afectados */}
        <Card>
          <CardHeader>
            <CardTitle>3. Interesados Afectados</CardTitle>
            <CardDescription>
              Categorías y número aproximado de interesados afectados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="categoriasAfectados"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías de interesados afectados *</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'EMPLEADOS', label: 'Empleados' },
                      { value: 'CLIENTES', label: 'Clientes' },
                      { value: 'PROVEEDORES', label: 'Proveedores' },
                      { value: 'USUARIOS_WEB', label: 'Usuarios web' },
                      { value: 'MENORES', label: 'Menores de edad' },
                      { value: 'OTROS', label: 'Otros' },
                    ].map((item) => (
                      <FormItem
                        key={item.value}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.value as typeof field.value[number])}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.value])
                                : field.onChange(
                                    field.value?.filter((value) => value !== item.value)
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroAfectados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de afectados *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroAfectadosAproximado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Número aproximado
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección 4: Categorías de datos */}
        <Card>
          <CardHeader>
            <CardTitle>4. Datos Personales Afectados</CardTitle>
            <CardDescription>
              Categorías y número aproximado de registros de datos afectados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="categoriasDatos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías de datos afectados *</FormLabel>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Datos ordinarios:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'IDENTIFICACION', label: 'Identificación (nombre, DNI)' },
                          { value: 'CONTACTO', label: 'Contacto (email, teléfono, dirección)' },
                          { value: 'ECONOMICOS', label: 'Económicos/financieros' },
                          { value: 'OTROS', label: 'Otros datos ordinarios' },
                        ].map((item) => (
                          <FormItem
                            key={item.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.value as typeof field.value[number])}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.value])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== item.value)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2 text-destructive">
                        Categorías especiales (Art. 9 RGPD):
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'SALUD', label: 'Datos de salud' },
                          { value: 'VIDA_SEXUAL', label: 'Vida/orientación sexual' },
                          { value: 'ORIGEN_RACIAL', label: 'Origen racial/étnico' },
                          { value: 'OPINIONES_POLITICAS', label: 'Opiniones políticas' },
                          { value: 'CREENCIAS_RELIGIOSAS', label: 'Creencias religiosas/filosóficas' },
                          { value: 'AFILIACION_SINDICAL', label: 'Afiliación sindical' },
                          { value: 'DATOS_GENETICOS', label: 'Datos genéticos' },
                          { value: 'DATOS_BIOMETRICOS', label: 'Datos biométricos' },
                        ].map((item) => (
                          <FormItem
                            key={item.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.value as typeof field.value[number])}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.value])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== item.value)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroRegistros"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de registros afectados *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroRegistrosAproximado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Número aproximado
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección 5: Punto de contacto (Art. 33.3.b) */}
        <Card>
          <CardHeader>
            <CardTitle>5. Punto de Contacto</CardTitle>
            <CardDescription>
              Datos del DPO o punto de contacto para más información
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="esDPO"
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
                      El contacto es el Delegado de Protección de Datos (DPO)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombreContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="telefonoContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección 6: Consecuencias probables (Art. 33.3.c) */}
        <Card>
          <CardHeader>
            <CardTitle>6. Consecuencias Probables</CardTitle>
            <CardDescription>
              Descripción de las consecuencias probables de la violación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="consecuencias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consecuencias probables *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa las posibles consecuencias para los afectados (pérdida financiera, daño reputacional, discriminación, suplantación de identidad, etc.)"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 50 caracteres. Considere todos los riesgos potenciales.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riesgoDerechos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de riesgo para los derechos y libertades *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el nivel de riesgo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BAJO">
                        Bajo - Impacto mínimo en los afectados
                      </SelectItem>
                      <SelectItem value="MEDIO">
                        Medio - Puede causar molestias significativas
                      </SelectItem>
                      <SelectItem value="ALTO">
                        Alto - Puede causar daños significativos
                      </SelectItem>
                      <SelectItem value="MUY_ALTO">
                        Muy Alto - Puede poner en peligro derechos fundamentales
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Si el riesgo es alto, debe notificar también a los afectados (Art. 34)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección 7: Medidas (Art. 33.3.d) */}
        <Card>
          <CardHeader>
            <CardTitle>7. Medidas Adoptadas y Propuestas</CardTitle>
            <CardDescription>
              Medidas para abordar la violación y mitigar sus efectos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="medidasAdoptadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medidas ya adoptadas *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa las medidas técnicas y organizativas ya implementadas (cambio de contraseñas, parcheado de sistemas, formación del personal, etc.)"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 50 caracteres. Sea específico sobre las acciones tomadas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medidasPropuestas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medidas propuestas adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa medidas adicionales planificadas para prevenir futuros incidentes similares"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección 8: Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>8. Notificaciones Realizadas</CardTitle>
            <CardDescription>
              Estado de las notificaciones a la AEPD y a los afectados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notificación AEPD */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notificadoAEPD"
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
                        Notificado a la AEPD (Agencia Española de Protección de Datos)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {notificadoAEPD && (
                <>
                  <FormField
                    control={form.control}
                    name="fechaNotificacionAEPD"
                    render={({ field }) => (
                      <FormItem>
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

                  <FormField
                    control={form.control}
                    name="numeroReferenciaAEPD"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de referencia AEPD</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: N/REF: 123456/2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <Separator />

            {/* Notificación afectados */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notificadoAfectados"
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
                        Notificado a los afectados
                      </FormLabel>
                      <FormDescription>
                        Obligatorio si existe alto riesgo para sus derechos (Art. 34)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {notificadoAfectados && (
                <>
                  <FormField
                    control={form.control}
                    name="fechaNotificacionAfectados"
                    render={({ field }) => (
                      <FormItem>
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

                  <FormField
                    control={form.control}
                    name="formaNotificacionAfectados"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de notificación</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Email individual, SMS, carta certificada, anuncio web..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información legal */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Información Legal</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Este formulario cumple con los requisitos del <strong>Artículo 33 del RGPD</strong> y 
              las directrices de la AEPD para la notificación de violaciones de seguridad.
            </p>
            <p className="text-sm">
              El incumplimiento de la obligación de notificación puede conllevar sanciones 
              de hasta 10 millones de euros o el 2% del volumen de negocio anual global (Art. 83.4.a RGPD).
            </p>
          </AlertDescription>
        </Alert>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/organizations/${organizationSlug}/incidents`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Reportando...' : 'Reportar Incidente'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}