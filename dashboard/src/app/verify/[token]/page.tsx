import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  History,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';

interface VersionHistory {
  id: string;
  versionNumber: number;
  isLatest: boolean;
  createdAt: string | Date;
  fechaDeteccion: string | Date | null;
  descripcion: string | null;
  tipoIncidente: string | null;
  categoriasDatos: string | null;
  numeroAfectados: number | null;
  impactoEconomico: number | null;
  medidaCorrectiva: string | null;
  estadoNotificacion: string | null;
  afectadosInformados: boolean | null;
  autoridadesNotificadas: boolean | null;
  fechaContencion: string | Date | null;
  fechaResolucion: string | Date | null;
  leccionesAprendidas: string | null;
  token: string;
  medidasAdoptadas: string | null;
  notificadoAEPD: boolean | null;
  fechaNotificacionAEPD: string | Date | null;
  notificadoAfectados: boolean | null;
  fechaNotificacionAfectados: string | Date | null;
}

async function getIncidentByToken(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/verify/${token}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching incident:', error);
    return null;
  }
}

export default async function VerifyIncidentPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getIncidentByToken(params.token);

  if (!data || !data.success) {
    notFound();
  }

  const { incident, currentVersion, history, totalVersions } = data;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No especificada';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const formatDateShort = (date: string | Date | null | undefined) => {
    if (!date) return 'No especificada';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Verificación de Incidente de Ciberseguridad
          </h1>
          <p className="text-muted-foreground">
            Registro verificado según RGPD Art. 33
          </p>
        </div>

        {/* Main Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Incidente #{incident.internalId}
              </CardTitle>
              <div className="flex gap-2">
                {currentVersion.fechaResolucion ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Resuelto
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500">
                    <Clock className="mr-1 h-3 w-3" />
                    En proceso
                  </Badge>
                )}
                <Badge variant="outline">
                  Versión {currentVersion.versionNumber} de {totalVersions}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Detection Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                Información del Incidente
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de detección
                  </p>
                  <p className="font-medium">
                    {formatDate(currentVersion.fechaDeteccion)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tipo de incidente
                  </p>
                  <p className="font-medium">
                    {currentVersion.tipoIncidente || 'No especificado'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="font-medium">
                  {currentVersion.descripcion || 'No especificada'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Affected Data */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Datos Afectados
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Categoría de datos
                  </p>
                  <p className="font-medium">
                    {currentVersion.categoriasDatos || 'No especificada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Número de afectados
                  </p>
                  <p className="font-medium">
                    {currentVersion.numeroAfectados || 0} personas
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Impact and Measures */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Impacto y Medidas
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Consecuencias/Riesgos
                  </p>
                  <p className="font-medium">
                    {currentVersion.consecuencias || 'No especificadas'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Medidas adoptadas
                  </p>
                  <p className="font-medium">
                    {currentVersion.medidasAdoptadas || 'No especificadas'}
                  </p>
                </div>
                {currentVersion.fechaResolucion && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha de resolución
                    </p>
                    <p className="font-medium">
                      {formatDate(currentVersion.fechaResolucion)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Notificaciones
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Notificado a AEPD</span>
                  {currentVersion.notificadoAEPD ? (
                    <div className="text-right">
                      <CheckCircle className="h-4 w-4 text-green-500 inline-block" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateShort(currentVersion.fechaNotificacionAEPD)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Notificado a afectados</span>
                  {currentVersion.notificadoAfectados ? (
                    <div className="text-right">
                      <CheckCircle className="h-4 w-4 text-green-500 inline-block" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateShort(
                          currentVersion.fechaNotificacionAfectados
                        )}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        {history && history.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <History className="mr-2 h-5 w-5" />
                Historial de Versiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {history.map((version: VersionHistory) => (
                  <AccordionItem
                    key={version.id}
                    value={`version-${version.id}`}
                  >
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>
                          Versión {version.versionNumber}
                          {version.isLatest && (
                            <Badge className="ml-2" variant="secondary">
                              Actual
                            </Badge>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-3">
                        <div className="grid gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Token:{' '}
                            </span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {version.token}
                            </code>
                          </div>
                          {version.descripcion && (
                            <div>
                              <span className="text-muted-foreground">
                                Descripción:{' '}
                              </span>
                              {version.descripcion}
                            </div>
                          )}
                          {version.medidasAdoptadas && (
                            <div>
                              <span className="text-muted-foreground">
                                Medidas:{' '}
                              </span>
                              {version.medidasAdoptadas}
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Token de verificación:</p>
          <code className="text-xs bg-muted px-2 py-1 rounded inline-block mt-1">
            {params.token}
          </code>
          <p className="mt-4">
            Este registro cumple con los requisitos del RGPD Art. 33
          </p>
        </div>
      </div>
    </div>
  );
}