'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Copy, 
  ExternalLink, 
  History,
  MoreVertical 
} from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';

import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { ExportPDFButton } from './export-pdf-button';

interface Incident {
  id: string;
  organizationId: string;
  internalId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentVersion {
  id: string;
  incidentId: string;
  token: string;
  fechaDeteccion?: Date | null;
  descripcion?: string | null;
  tipoIncidente?: string | null;
  categoriasDatos?: string | null;
  numeroAfectados?: number | null;
  consecuencias?: string | null;
  medidasAdoptadas?: string | null;
  fechaResolucion?: Date | null;
  notificadoAEPD?: boolean | null;
  fechaNotificacionAEPD?: Date | null;
  notificadoAfectados?: boolean | null;
  fechaNotificacionAfectados?: Date | null;
  isLatest: boolean;
  versionNumber: number;
  notasInternas?: string | null;
  createdAt: Date;
  createdBy: string;
}

interface IncidentSecondaryActionsProps {
  slug: string;
  incidentId: string;
  token: string;
  incident: Incident;
  currentVersion: IncidentVersion;
  totalVersions: number;
}

export function IncidentSecondaryActions({
  slug,
  incidentId,
  token,
  incident,
  currentVersion,
  totalVersions,
}: IncidentSecondaryActionsProps) {
  const [copying, setCopying] = useState(false);

  const handleCopyToken = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado al portapapeles');
    } catch (_error) {
      toast.error('Error al copiar el token');
    } finally {
      setCopying(false);
    }
  };

  const handleOpenPublicView = () => {
    const publicUrl = `${window.location.origin}/verify/${token}`;
    window.open(publicUrl, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4 mr-2" />
          Acciones
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyToken} disabled={copying}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar Token
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenPublicView}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Vista Pública
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/organizations/${slug}/incidents/${incidentId}/history`}>
            <History className="mr-2 h-4 w-4" />
            Ver Historial
          </Link>
        </DropdownMenuItem>
        <ExportPDFButton
          incident={incident}
          currentVersion={currentVersion}
          totalVersions={totalVersions}
          isPublic={false}
          asMenuItem={true}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}