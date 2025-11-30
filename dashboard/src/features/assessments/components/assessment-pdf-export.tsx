'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { type EvaluationRecord } from '../data/assessment-db';

interface AssessmentPdfExportProps {
  assessment: EvaluationRecord;
  organizationSlug: string;
  userName?: string;
  userEmail?: string;
}

export function AssessmentPdfExport({ 
  assessment,
  organizationSlug,
  userName,
  userEmail
}: AssessmentPdfExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Dynamically import PDF libraries to avoid loading crypto-js on page load
      const [{ pdf }, { AssessmentPDFDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./assessment-pdf-document')
      ]);

      // Generate PDF using React PDF
      const doc = (
        <AssessmentPDFDocument
          assessment={assessment}
          organizationSlug={organizationSlug}
          userName={userName}
          userEmail={userEmail}
        />
      );

      const blob = await pdf(doc).toBlob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluacion-ciberseguridad-${assessment.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar el PDF', {
        description: 'Por favor, inténtelo de nuevo más tarde.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Generando...' : 'Exportar PDF'}
    </Button>
  );
}