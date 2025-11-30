'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';
import { toast } from '@workspace/ui/components/sonner';
import { format } from 'date-fns';

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

interface ExportPDFButtonProps {
  incident: Incident;
  currentVersion: IncidentVersion;
  totalVersions: number;
  isPublic?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  asMenuItem?: boolean;
}

export function ExportPDFButton({
  incident,
  currentVersion,
  totalVersions,
  isPublic = false,
  variant = 'outline',
  className,
  asMenuItem = false,
}: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // Dynamically import PDF libraries to avoid loading crypto-js on page load
      const [{ pdf }, { IncidentPDFDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./incident-pdf-document')
      ]);

      // Generate the PDF document
      const doc = (
        <IncidentPDFDocument
          incident={incident}
          currentVersion={currentVersion}
          totalVersions={totalVersions}
          isPublic={isPublic}
        />
      );

      // Create blob from the document
      const blob = await pdf(doc).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename with date
      const date = format(new Date(), 'yyyy-MM-dd');
      const filename = `incidente-${incident.internalId}-v${currentVersion.versionNumber}-${date}.pdf`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
      
      toast.success('PDF exportado', {
        description: `El archivo ${filename} se ha descargado correctamente`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF', {
        description: 'No se pudo generar el documento PDF. Por favor intente nuevamente.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (asMenuItem) {
    return (
      <DropdownMenuItem onClick={generatePDF} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Exportar como PDF
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={generatePDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}