'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2, Save, AlertTriangle, Info } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Calendar } from '@workspace/ui/components/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { toast } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

import { updateIncident } from '~/src/features/incidents/actions/update-incident';

interface Incident {
  id: string;
  [key: string]: unknown;
}

interface IncidentVersion {
  fechaDeteccion?: string | Date | null;
  descripcion?: string | null;
  tipoIncidente?: string | null;
  categoriasDatos?: string | null;
  numeroAfectados?: number | null;
  consecuencias?: string | null;
  medidasAdoptadas?: string | null;
  fechaResolucion?: string | Date | null;
  notificadoAEPD?: boolean | null;
  fechaNotificacionAEPD?: string | Date | null;
  notificadoAfectados?: boolean | null;
  fechaNotificacionAfectados?: string | Date | null;
  notasInternas?: string | null;
  [key: string]: unknown;
}

interface EditIncidentFormProps {
  incident: Incident;
  latestVersion: IncidentVersion;
  organizationId: string;
  userId: string;
  slug: string;
}

export function EditIncidentForm({ 
  incident, 
  latestVersion, 
  organizationId, 
  userId,
  slug 
}: EditIncidentFormProps): React.JSX.Element {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Form state
  const [formData, setFormData] = React.useState({
    fechaDeteccion: latestVersion.fechaDeteccion ? new Date(latestVersion.fechaDeteccion) : null,
    descripcion: latestVersion.descripcion || '',
    tipoIncidente: latestVersion.tipoIncidente || '',
    categoriasDatos: latestVersion.categoriasDatos || '',
    numeroAfectados: latestVersion.numeroAfectados || 0,
    consecuencias: latestVersion.consecuencias || '',
    medidasAdoptadas: latestVersion.medidasAdoptadas || '',
    fechaResolucion: latestVersion.fechaResolucion ? new Date(latestVersion.fechaResolucion) : null,
    notificadoAEPD: latestVersion.notificadoAEPD || false,
    fechaNotificacionAEPD: latestVersion.fechaNotificacionAEPD ? new Date(latestVersion.fechaNotificacionAEPD) : null,
    notificadoAfectados: latestVersion.notificadoAfectados || false,
    fechaNotificacionAfectados: latestVersion.fechaNotificacionAfectados ? new Date(latestVersion.fechaNotificacionAfectados) : null,
    notasInternas: latestVersion.notasInternas || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateIncident({
        incidentId: incident.id,
        organizationId,
        userId,
        ...formData,
      });

      if (result.success) {
        toast.success('Incidente actualizado', {
          description: 'Se ha generado un nuevo token de verificación'
        });
        
        // Redirect to success page with new token
        router.push(`/organizations/${slug}/incidents/${incident.id}/edit/success?token=${result.token}`);
      } else {
        toast.error('Error al actualizar', {
          description: result.error || 'No se pudo actualizar el incidente'
        });
      }
    } catch (_error) {
      toast.error('Error inesperado', {
        description: 'Por favor intente nuevamente'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate if within 72 hours
  const hoursElapsed = formData.fechaDeteccion 
    ? Math.floor((Date.now() - formData.fechaDeteccion.getTime()) / (1000 * 60 * 60))
    : 0;
  const isWithin72Hours = hoursElapsed <= 72;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warning if approaching 72 hour deadline */}
      {hoursElapsed > 48 && isWithin72Hours && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="ml-6 mt-1">Plazo AEPD Próximo a Vencer</AlertTitle>
          <AlertDescription className="mt-1">
            Han transcurrido {hoursElapsed} horas desde la detección. 
            Quedan {72 - hoursElapsed} horas para notificar a la AEPD.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="impact">Impacto y Medidas</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="notes">Notas Internas</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Incidente</CardTitle>
              <CardDescription>
                Actualice los datos básicos del incidente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fechaDeteccion">Fecha de Detección *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.fechaDeteccion && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.fechaDeteccion ? (
                          format(formData.fechaDeteccion, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.fechaDeteccion || undefined}
                        onSelect={(date) => setFormData((prev: typeof formData) => ({ ...prev, fechaDeteccion: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoIncidente">Tipo de Incidente *</Label>
                  <Select 
                    value={formData.tipoIncidente}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipoIncidente: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ransomware">Ransomware</SelectItem>
                      <SelectItem value="phishing">Phishing</SelectItem>
                      <SelectItem value="data_breach">Brecha de Datos</SelectItem>
                      <SelectItem value="unauthorized_access">Acceso No Autorizado</SelectItem>
                      <SelectItem value="data_loss">Pérdida de Datos</SelectItem>
                      <SelectItem value="malware">Malware</SelectItem>
                      <SelectItem value="dos">Denegación de Servicio</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción del Incidente *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describa detalladamente qué ocurrió, cómo se detectó y qué sistemas fueron afectados"
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoriasDatos">Categorías de Datos Afectados</Label>
                  <Input
                    id="categoriasDatos"
                    value={formData.categoriasDatos}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoriasDatos: e.target.value }))}
                    placeholder="Ej: Datos personales, financieros, salud"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroAfectados">Número de Afectados</Label>
                  <Input
                    id="numeroAfectados"
                    type="number"
                    value={formData.numeroAfectados}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroAfectados: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto y Medidas Adoptadas</CardTitle>
              <CardDescription>
                Documente las consecuencias y acciones tomadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="consecuencias">Consecuencias del Incidente</Label>
                <Textarea
                  id="consecuencias"
                  value={formData.consecuencias}
                  onChange={(e) => setFormData(prev => ({ ...prev, consecuencias: e.target.value }))}
                  placeholder="Describa el impacto y las consecuencias del incidente"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medidasAdoptadas">Medidas Adoptadas</Label>
                <Textarea
                  id="medidasAdoptadas"
                  value={formData.medidasAdoptadas}
                  onChange={(e) => setFormData(prev => ({ ...prev, medidasAdoptadas: e.target.value }))}
                  placeholder="Detalle las medidas técnicas y organizativas implementadas"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaResolucion">Fecha de Resolución</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fechaResolucion && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fechaResolucion ? (
                        format(formData.fechaResolucion, "PPP", { locale: es })
                      ) : (
                        <span>No resuelto aún</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fechaResolucion || undefined}
                      onSelect={(date) => setFormData((prev: typeof formData) => ({ ...prev, fechaResolucion: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Notificaciones</CardTitle>
              <CardDescription>
                Registro de notificaciones a autoridades y afectados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AEPD Notification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificadoAEPD">Notificado a AEPD</Label>
                    <p className="text-sm text-muted-foreground">
                      Obligatorio en 72 horas si hay riesgo para derechos y libertades
                    </p>
                  </div>
                  <Switch
                    id="notificadoAEPD"
                    checked={formData.notificadoAEPD}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificadoAEPD: checked }))}
                  />
                </div>

                {formData.notificadoAEPD && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="fechaNotificacionAEPD">Fecha de Notificación AEPD</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.fechaNotificacionAEPD && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.fechaNotificacionAEPD ? (
                            format(formData.fechaNotificacionAEPD, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fechaNotificacionAEPD || undefined}
                          onSelect={(date) => setFormData((prev: typeof formData) => ({ ...prev, fechaNotificacionAEPD: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Affected Parties Notification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificadoAfectados">Notificado a Afectados</Label>
                    <p className="text-sm text-muted-foreground">
                      Obligatorio si hay alto riesgo para sus derechos y libertades
                    </p>
                  </div>
                  <Switch
                    id="notificadoAfectados"
                    checked={formData.notificadoAfectados}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificadoAfectados: checked }))}
                  />
                </div>

                {formData.notificadoAfectados && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="fechaNotificacionAfectados">Fecha de Notificación a Afectados</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.fechaNotificacionAfectados && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.fechaNotificacionAfectados ? (
                            format(formData.fechaNotificacionAfectados, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fechaNotificacionAfectados || undefined}
                          onSelect={(date) => setFormData((prev: typeof formData) => ({ ...prev, fechaNotificacionAfectados: date || null }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Internas</CardTitle>
              <CardDescription>
                Información adicional para uso interno (no visible en el portal público)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notasInternas}
                onChange={(e) => setFormData(prev => ({ ...prev, notasInternas: e.target.value }))}
                placeholder="Notas, observaciones o información adicional relevante para el equipo interno"
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="ml-6 mt-1">Nuevo Token al Actualizar</AlertTitle>
        <AlertDescription className="mt-1">
          Al guardar los cambios se generará un nuevo token de verificación para esta versión del incidente.
          El historial completo de versiones permanecerá disponible.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/organizations/${slug}/incidents/${incident.id}`)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Actualizar Incidente
            </>
          )}
        </Button>
      </div>
    </form>
  );
}