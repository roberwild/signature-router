'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Copy,
  Edit,
  Eye,
  History,
  CheckCircle,
  Clock,
  FileText,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { toast } from '@workspace/ui/components/sonner';
import { ExportPDFButton } from './export-pdf-button';

interface IncidentVersion {
  id: string;
  incidentId: string;
  createdBy: string;
  token: string;
  fechaDeteccion?: Date | null;
  descripcion?: string | null;
  tipoIncidente?: string | null;
  numeroAfectados?: number | null;
  fechaResolucion?: Date | null;
  notificadoAEPD?: boolean | null;
  notificadoAfectados?: boolean | null;
  versionNumber: number;
  isLatest: boolean;
  createdAt: Date;
}

interface Incident {
  id: string;
  internalId: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentWithVersion {
  incident: Incident;
  latestVersion: IncidentVersion | null;
}

interface IncidentListProps {
  incidents: IncidentWithVersion[];
  organizationSlug: string;
}

export function IncidentList({
  incidents,
  organizationSlug,
}: IncidentListProps) {
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      toast.success('Token copiado', {
        description: 'El token ha sido copiado al portapapeles',
      });
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (_error) {
      toast.error('Error', {
        description: 'No se pudo copiar el token',
      });
    }
  };

  const getStatusBadge = (version: IncidentVersion | null) => {
    if (!version) {
      return <Badge variant="secondary">Sin datos</Badge>;
    }

    if (version.fechaResolucion) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Resuelto
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-500">
        <Clock className="mr-1 h-3 w-3" />
        En proceso
      </Badge>
    );
  };

  const getNotificationBadges = (version: IncidentVersion | null) => {
    if (!version) return null;

    return (
      <div className="flex gap-2">
        {version.notificadoAEPD && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">
                  AEPD
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificado a AEPD</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {version.notificadoAfectados && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">
                  Afectados
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notificado a afectados</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No hay incidentes registrados</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-4">
          Cuando registres tu primer incidente, aparecerá aquí
        </p>
        <Button 
          onClick={() => router.push(`/organizations/${organizationSlug}/incidents/new`)}
        >
          Reportar Primer Incidente
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Fecha Detección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notificaciones</TableHead>
            <TableHead>Afectados</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map(({ incident, latestVersion }) => (
            <TableRow 
              key={incident.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}`)}
            >
              <TableCell className="font-medium">
                #{incident.internalId}
              </TableCell>
              <TableCell>
                {latestVersion?.tipoIncidente || '-'}
              </TableCell>
              <TableCell className="max-w-[300px]">
                <p className="truncate">
                  {latestVersion?.descripcion || 'Sin descripción'}
                </p>
              </TableCell>
              <TableCell>
                {latestVersion?.fechaDeteccion
                  ? format(new Date(latestVersion.fechaDeteccion), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })
                  : '-'}
              </TableCell>
              <TableCell>{getStatusBadge(latestVersion)}</TableCell>
              <TableCell>{getNotificationBadges(latestVersion)}</TableCell>
              <TableCell>
                {latestVersion?.numeroAfectados || 0}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar incidente
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/organizations/${organizationSlug}/incidents/${incident.id}/history`)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Ver historial
                    </DropdownMenuItem>
                    {latestVersion && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => copyToken(latestVersion.token)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copiedToken === latestVersion.token
                            ? 'Copiado!'
                            : 'Copiar token'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/verify/${latestVersion.token}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Vista pública
                        </DropdownMenuItem>
                      </>
                    )}
                    {latestVersion && (
                      <>
                        <DropdownMenuSeparator />
                        <ExportPDFButton
                          incident={incident}
                          currentVersion={latestVersion}
                          totalVersions={1}
                          isPublic={false}
                          asMenuItem={true}
                        />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}