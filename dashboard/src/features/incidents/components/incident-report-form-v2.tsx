'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, AlertTriangle, Shield, Users, Database, FileWarning } from 'lucide-react';

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

import { createIncident } from '~/actions/incidents/create-incident';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  incidentFormSchema,
  type IncidentFormValues,
  TIPO_INCIDENTE,
  CATEGORIA_DATOS,
  ESTADO_INCIDENTE
} from '~/schemas/incidents/incident-form-schema';

interface IncidentReportFormV2Props {
  organizationId: string;
  organizationSlug: string;
  userId: string;
}

export function IncidentReportFormV2({ organizationSlug }: IncidentReportFormV2Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const onSubmit = async (values: IncidentFormValues) => {
    if (!isSubmitting) {
      setIsSubmitting(true);
      try {
        const result = await createIncident(values);
        
        if (result?.serverError) {
          toast.error(result.serverError);
        } else if (result?.data) {
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

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Alerta 72 horas */}
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <Clock className="h-4 w-4 text-yellow-600" />
          <div className="ml-2">
            <AlertTitle className="text-yellow-800 dark:text-yellow-200 pl-4 pt-1">
              Plazo legal: 72 horas
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-1 pt-1">
              Según el Art. 33 del RGPD, debe notificar a la AEPD sin dilación indebida 
              y a más tardar 72 horas después de tener conocimiento del incidente.
            </AlertDescription>
          </div>
        </Alert>

        {/* Sección 1: Identificación del incidente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              1. Identificación del Incidente
            </CardTitle>
            <CardDescription>
              Información básica sobre la detección y naturaleza del incidente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fecha y hora de detección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deteccionAt"
                render={({ field }) => (
                  <FormItem>
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

            {/* Tipo de incidente */}
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

            {/* Descripción breve */}
            <FormField
              control={form.control}
              name="descripcionBreve"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción breve del incidente *</FormLabel>
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

            {/* Categorías de datos afectados */}
            <FormField
              control={form.control}
              name="categoriaDatos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías de datos afectados *</FormLabel>
                  <FormDescription>
                    Seleccione todas las categorías de datos personales que se han visto comprometidas
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {Object.entries(CATEGORIA_DATOS).map(([_key, value]) => (
                      <FormItem
                        key={value}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(value)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...(field.value || []), value]
                                : field.value?.filter((v) => v !== value) || [];
                              field.onChange(updatedValue);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal capitalize">
                          {value.replace('_', ' ')}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número de afectados y registros */}
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

        {/* Sección 2: Consecuencias y evaluación del riesgo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              2. Consecuencias y Evaluación del Riesgo
            </CardTitle>
            <CardDescription>
              Impacto del incidente en los derechos y libertades de los afectados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="consecuencias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consecuencias del incidente *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa las consecuencias reales o potenciales del incidente..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Incluya impactos en confidencialidad, integridad y disponibilidad
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
                  <FormLabel>Riesgos probables para los afectados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa los riesgos para los derechos y libertades de las personas afectadas..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    P.ej.: suplantación de identidad, pérdidas económicas, daño reputacional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Sección 3: Medidas adoptadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              3. Medidas de Mitigación
            </CardTitle>
            <CardDescription>
              Acciones tomadas para controlar el incidente y prevenir futuros
            </CardDescription>
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
                      className="min-h-[100px]"
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
                  <FormLabel>Medidas previstas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa las medidas adicionales planificadas..."
                      className="min-h-[100px]"
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

        {/* Sección 4: Punto de contacto (DPO) */}
        <Card>
          <CardHeader>
            <CardTitle>4. Punto de Contacto (Art. 33.3.b)</CardTitle>
            <CardDescription>
              Datos del DPO o persona de contacto para más información
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {/* Sección 5: Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>5. Notificaciones a Autoridades y Afectados</CardTitle>
            <CardDescription>
              Estado de las comunicaciones obligatorias según RGPD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notificación AEPD */}
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
                    <FormLabel className="font-medium">
                      Notificado a la AEPD
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchNotificadoAEPD && (
                <>
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
                          <FormLabel>Razón del retraso (más de 72 horas) *</FormLabel>
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
                </>
              )}
            </div>

            {/* Notificación afectados */}
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
                    <FormLabel className="font-medium">
                      Notificado a los afectados
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchNotificadoAfectados && (
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección 6: Notas internas */}
        <Card>
          <CardHeader>
            <CardTitle>6. Información Privada</CardTitle>
            <CardDescription>
              Esta información NO se mostrará en la consulta pública por token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="privadoNotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles técnicos, IOCs, información sensible que no debe ser pública..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use este campo para documentación interna y detalles técnicos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/organizations/${organizationSlug}/incidents`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar Incidente'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}