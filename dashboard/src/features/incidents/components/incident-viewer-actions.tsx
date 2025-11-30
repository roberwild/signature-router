'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  ExternalLink,
  Edit,
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

interface IncidentViewerActionsProps {
  slug: string;
  incidentId: string;
  token: string;
  incident: Incident;
  currentVersion: IncidentVersion;
  totalVersions: number;
}

export function IncidentViewerActions({
  slug,
  incidentId,
  token,
  incident,
  currentVersion,
  totalVersions,
}: IncidentViewerActionsProps) {
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
    <div className="flex items-center gap-2">
      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToken}
          disabled={copying}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copiar Token
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPublicView}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Vista Pública
        </Button>

        <ExportPDFButton
          incident={incident}
          currentVersion={currentVersion}
          totalVersions={totalVersions}
          isPublic={false}
          variant="outline"
        />

        <Link
          href={`/organizations/${slug}/incidents/${incidentId}/history`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        >
          <History className="mr-2 h-4 w-4" />
          Historial
        </Link>

        <Link
          href={`/organizations/${slug}/incidents/${incidentId}/edit`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Link>
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyToken}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar Token
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenPublicView}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Vista Pública
            </DropdownMenuItem>
            <ExportPDFButton
              incident={incident}
              currentVersion={currentVersion}
              totalVersions={totalVersions}
              isPublic={false}
              asMenuItem={true}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/organizations/${slug}/incidents/${incidentId}/history`}>
                <History className="mr-2 h-4 w-4" />
                Ver Historial
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/organizations/${slug}/incidents/${incidentId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Incidente
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}