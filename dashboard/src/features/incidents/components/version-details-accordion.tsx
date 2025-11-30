'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, AlertCircle } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';

interface IncidentVersion {
  id: string | number;
  versionNumber: number;
  isLatest: boolean;
  createdAt: string | Date | null;
  fechaDeteccion: string | Date | null;
  tipoIncidente: string | null;
  descripcion: string | null;
  categoriasDatos: string | null;
  numeroAfectados: number | null;
  consecuencias: string | null;
  medidasAdoptadas: string | null;
  notificadoAEPD: boolean | null;
  fechaNotificacionAEPD: string | Date | null;
  notificadoAfectados: boolean | null;
  fechaNotificacionAfectados: string | Date | null;
  fechaResolucion: string | Date | null;
  notasInternas: string | null;
}

interface VersionDetailsAccordionProps {
  versions: IncidentVersion[];
}

export function VersionDetailsAccordion({ versions }: VersionDetailsAccordionProps) {
  const formatDateShort = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {versions.map((version) => (
        <AccordionItem key={version.id} value={`version-${version.id}`}>
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full mr-4">
              <div className="flex items-center gap-3">
                <Badge variant={version.isLatest ? "default" : "outline"}>
                  v{version.versionNumber}
                </Badge>
                <span>
                  {version.isLatest ? 'Versión Actual' : `Versión ${version.versionNumber}`}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDateShort(version.createdAt)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {/* Basic Information */}
              <div>
                <h5 className="font-medium mb-2">Información Básica</h5>
                <div className="grid gap-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Fecha de detección:</span>
                      <p className="font-medium">{formatDateShort(version.fechaDeteccion)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo de incidente:</span>
                      <p className="font-medium">{version.tipoIncidente || 'No especificado'}</p>
                    </div>
                  </div>
                  {version.descripcion && (
                    <div>
                      <span className="text-muted-foreground">Descripción:</span>
                      <p className="mt-1">{version.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Impact */}
              <div>
                <h5 className="font-medium mb-2">Impacto</h5>
                <div className="grid gap-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Categorías de datos:</span>
                      <p className="font-medium">{version.categoriasDatos || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número de afectados:</span>
                      <p className="font-medium">{version.numeroAfectados || 0} personas</p>
                    </div>
                  </div>
                  {version.consecuencias && (
                    <div>
                      <span className="text-muted-foreground">Consecuencias:</span>
                      <p className="mt-1">{version.consecuencias}</p>
                    </div>
                  )}
                </div>
              </div>

              {version.medidasAdoptadas && (
                <>
                  <Separator />
                  <div>
                    <h5 className="font-medium mb-2">Medidas Adoptadas</h5>
                    <p className="text-sm">{version.medidasAdoptadas}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Notifications */}
              <div>
                <h5 className="font-medium mb-2">Notificaciones</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 border rounded bg-card">
                    <span className="text-sm">AEPD</span>
                    {version.notificadoAEPD ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs">{formatDateShort(version.fechaNotificacionAEPD)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No notificado</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded bg-card">
                    <span className="text-sm">Afectados</span>
                    {version.notificadoAfectados ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-xs">{formatDateShort(version.fechaNotificacionAfectados)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No notificado</span>
                    )}
                  </div>
                </div>
              </div>

              {version.fechaResolucion && (
                <>
                  <Separator />
                  <div>
                    <h5 className="font-medium mb-2">Resolución</h5>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        Resuelto el {formatDateShort(version.fechaResolucion)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {version.notasInternas && (
                <>
                  <Separator />
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="ml-6 mt-1">Notas Internas</AlertTitle>
                    <AlertDescription className="mt-1">
                      {version.notasInternas}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}