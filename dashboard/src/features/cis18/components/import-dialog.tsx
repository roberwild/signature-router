'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {  FileSpreadsheet, Download, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

interface ExcelRow {
  Fecha?: string;
  [key: string]: string | number | undefined;
}

interface CIS18Assessment {
  organizationId: string;
  assessmentDate: string;
  importMethod: string;
  [key: string]: string | number | null;
}

export function ImportDialog({ isOpen, onClose, organizationId }: ImportDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const downloadTemplate = () => {
    // Create template with headers
    const template = [
      {
        'Fecha': new Date().toISOString().split('T')[0],
        'Control 1 - Inventario de Activos': 85,
        'Control 2 - Inventario de Software': 75,
        'Control 3 - Gestión de Datos': 90,
        'Control 4 - Configuración Segura': 80,
        'Control 5 - Gestión de Cuentas': 70,
        'Control 6 - Control de Acceso': 85,
        'Control 7 - Gestión de Vulnerabilidades': 75,
        'Control 8 - Gestión de Auditoría': 80,
        'Control 9 - Protección contra Malware': 90,
        'Control 10 - Recuperación de Datos': 85,
        'Control 11 - Seguridad de Red': 75,
        'Control 12 - Gestión de Dispositivos': 80,
        'Control 13 - Monitoreo de Seguridad': 70,
        'Control 14 - Concienciación de Seguridad': 85,
        'Control 15 - Gestión de Proveedores': 75,
        'Control 16 - Seguridad de Aplicaciones': 80,
        'Control 17 - Respuesta a Incidentes': 90,
        'Control 18 - Pruebas de Penetración': 85,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CIS-18 Template');
    
    // Generate and download
    XLSX.writeFile(wb, 'CIS-18_template.xlsx');
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'csv') {
        // Process CSV
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            data.push(row);
          }
        }
        
        await uploadData(data as ExcelRow[]);
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        // Process Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        
        await uploadData(data as ExcelRow[]);
      } else {
        throw new Error('Formato de archivo no soportado. Use CSV o Excel.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadData = async (data: ExcelRow[]) => {
    // Map the data to our format
    const assessments = data.map(row => {
      const assessment: CIS18Assessment = {
        organizationId,
        assessmentDate: row['Fecha'] || new Date().toISOString(),
        importMethod: 'excel',
      };

      // Map controls - handle both numeric and named columns
      for (let i = 1; i <= 18; i++) {
        const numericKey = `Control ${i}`;
        const namedKey = Object.keys(row).find(k => k.startsWith(`Control ${i} -`));
        const value = row[numericKey] || row[namedKey || ''] || null;
        assessment[`control${i}`] = value ? parseInt(String(value), 10) : null;
      }

      return assessment;
    });

    // Send to API
    const response = await fetch('/api/cis18/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assessments }),
    });

    if (!response.ok) {
      throw new Error('Error al importar los datos');
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleManualEntry = () => {
    onClose();
    router.push(`/organizations/${organizationId}/cis-18/new`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Datos CIS-18</DialogTitle>
          <DialogDescription>
            Selecciona cómo deseas importar los resultados de la auditoría
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="ml-6 mt-1">Error</AlertTitle>
            <AlertDescription className="mt-1">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="ml-6 mt-1 text-green-800">¡Éxito!</AlertTitle>
            <AlertDescription className="mt-1 text-green-700">
              Los datos se han importado correctamente
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Archivo</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Plantilla Excel</p>
                  <p className="text-xs text-muted-foreground">
                    Descarga la plantilla con el formato correcto
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Subir archivo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: CSV, Excel (.xlsx, .xls)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-center py-8">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Entrada Manual de Datos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ingresa manualmente los resultados de cada control CIS
              </p>
              <Button onClick={handleManualEntry}>
                Comenzar entrada manual
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="ml-6 mt-1">Integración API</AlertTitle>
                <AlertDescription className="mt-1">
                  Usa el siguiente endpoint para enviar datos programáticamente:
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                POST /api/cis18/import
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Ejemplo de payload:</p>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`{
  "assessments": [{
    "organizationId": "uuid",
    "assessmentDate": "2024-01-01",
    "control1": 85,
    "control2": 75,
    ...
    "control18": 90
  }]
}`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}