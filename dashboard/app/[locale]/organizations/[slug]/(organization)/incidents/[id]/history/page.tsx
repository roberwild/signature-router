import * as React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  History,
  Shield,
  Clock,
  User,
  FileText,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';

import {  buttonVariants } from '@workspace/ui/components/button';

import { createTitle } from '~/lib/formatters';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { VersionDetailsAccordion } from '~/src/features/incidents/components/version-details-accordion';

export const metadata: Metadata = {
  title: createTitle('Historial de Incidente')
};

// Interface for incident version data
interface IncidentVersionData {
  id: string;
  incidentId: string;
  token: string;
  fechaDeteccion: Date | null;
  descripcion: string | null;
  tipoIncidente: string | null;
  categoriasDatos: string | null;
  numeroAfectados: number | null;
  consecuencias: string | null;
  medidasAdoptadas: string | null;
  fechaResolucion: Date | null;
  notificadoAEPD: boolean | null;
  fechaNotificacionAEPD: Date | null;
  notificadoAfectados: boolean | null;
  fechaNotificacionAfectados: Date | null;
  isLatest: boolean;
  versionNumber: number;
  notasInternas: string | null;
  createdAt: Date;
  createdBy: string;
}

interface HistoryPageProps {
  params: {
    slug: string;
    id: string;
  };
}

export default async function IncidentHistoryPage({ params }: HistoryPageProps) {
  const session = await auth();
  const { slug, id } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  // Fetch incident data with all versions
  const incidentData = await incidentDb.getIncidentWithHistory(id);

  if (!incidentData) {
    notFound();
  }

  // Verify the incident belongs to this organization
  if (incidentData.incident.organizationId !== organizationId) {
    notFound();
  }

  const { incident, versions } = incidentData;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No especificada';
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  const formatDateShort = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  // Get changes between versions
  const getChanges = (current: IncidentVersionData, previous: IncidentVersionData | null) => {
    const changes = [];
    
    if (current.descripcion !== previous?.descripcion) {
      changes.push('Descripción actualizada');
    }
    if (current.medidasAdoptadas !== previous?.medidasAdoptadas) {
      changes.push('Medidas adoptadas actualizadas');
    }
    if (current.fechaResolucion && !previous?.fechaResolucion) {
      changes.push('Incidente marcado como resuelto');
    }
    if (current.notificadoAEPD === true && previous?.notificadoAEPD !== true) {
      changes.push('Notificado a AEPD');
    }
    if (current.notificadoAfectados && !previous?.notificadoAfectados) {
      changes.push('Notificado a afectados');
    }
    if (current.numeroAfectados !== previous?.numeroAfectados) {
      changes.push('Número de afectados actualizado');
    }
    
    return changes.length > 0 ? changes : ['Actualización de información'];
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title={`Historial del Incidente #${incident.internalId}`}
              info="Registro completo de todas las versiones y modificaciones del incidente"
            />
            <Badge variant="outline">
              {versions.length} {versions.length === 1 ? 'versión' : 'versiones'}
            </Badge>
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Resumen del Incidente
              </CardTitle>
              <CardDescription>
                Información general y estado actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de creación</p>
                  <p className="font-medium">{formatDateShort(incident.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última actualización</p>
                  <p className="font-medium">{formatDateShort(incident.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado actual</p>
                  {versions[0]?.fechaResolucion ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Resuelto
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-yellow-600">
                      <Clock className="mr-1 h-3 w-3" />
                      En proceso
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Línea de Tiempo
              </CardTitle>
              <CardDescription>
                Historial cronológico de todas las versiones del incidente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Timeline items */}
                <div className="space-y-6">
                  {versions.map((version, index) => {
                    const previousVersion = versions[index + 1];
                    const changes = getChanges(version, previousVersion);
                    const isLatest = index === 0;
                    
                    return (
                      <div key={version.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div 
                          className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 ${
                            isLatest 
                              ? 'border-primary bg-primary text-primary-foreground' 
                              : 'border-muted bg-background'
                          }`}
                        >
                          <span className="text-sm font-bold">v{version.versionNumber}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  Versión {version.versionNumber}
                                  {isLatest && (
                                    <Badge variant="secondary">Actual</Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatDate(version.createdAt)}
                                </p>
                              </div>
                              {version.createdBy && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>Usuario #{version.createdBy.slice(0, 8)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Changes list */}
                            <div className="space-y-2 mb-3">
                              <p className="text-sm font-medium">Cambios realizados:</p>
                              <ul className="space-y-1">
                                {changes.map((change, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ChevronRight className="h-3 w-3" />
                                    {change}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {/* Version token */}
                            <div className="pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Token de verificación:</p>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                                {version.token}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Versions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles de Versiones
              </CardTitle>
              <CardDescription>
                Información completa de cada versión del incidente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VersionDetailsAccordion versions={versions} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href={`/organizations/${slug}/incidents`}
              className={buttonVariants({ variant: 'outline' })}
            >
              Volver a Incidentes
            </Link>
            <Link
              href={`/organizations/${slug}/incidents/${id}`}
              className={buttonVariants({ variant: 'default' })}
            >
              Ver Detalles Actuales
            </Link>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}