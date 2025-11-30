'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

import { FileDropzone } from '@workspace/ui/components/file-dropzone';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Archive,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'proposal' | 'report' | 'contract' | 'other';
  size: number;
  uploadedAt: Date;
  url?: string;
}

interface DocumentManagementSectionProps {
  requestId: string;
  documents?: Document[];
}

const DOCUMENT_TYPE_LABELS = {
  invoice: 'Factura',
  proposal: 'Propuesta',
  report: 'Reporte',
  contract: 'Contrato',
  other: 'Otro'
};

const DOCUMENT_TYPE_COLORS = {
  invoice: 'bg-green-100 text-green-800 border-green-200',
  proposal: 'bg-blue-100 text-blue-800 border-blue-200',
  report: 'bg-purple-100 text-purple-800 border-purple-200',
  contract: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function DocumentManagementSection({
  requestId: _requestId,
  documents = []
}: DocumentManagementSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    toast.success(`${acceptedFiles.length} archivo(s) agregado(s)`);
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      // TODO: Implement actual file upload logic here
      // For now, just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${uploadedFiles.length} documento(s) subido(s) exitosamente`);
      setUploadedFiles([]);
    } catch (_error) {
      toast.error('Error al subir los documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle>Subir Documentos</CardTitle>
          </div>
          <CardDescription>
            Sube facturas, propuestas, reportes y otros documentos relacionados con esta solicitud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone
            title="Arrastra documentos aquí"
            subtitle="o haz clic para seleccionar archivos"
            value={uploadedFiles}
            onDrop={handleFileDrop}
            onRemove={handleFileRemove}
            onError={(error) => toast.error(error.message)}
            maxFiles={10}
            maxSize={25 * 1024 * 1024} // 25MB
          />
          
          {uploadedFiles.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                className="min-w-32"
              >
                {isUploading ? (
                  <>
                    <Archive className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Archivos
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              <CardTitle>Documentos Adjuntos</CardTitle>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {documents.length} archivo(s)
            </Badge>
          </div>
          <CardDescription>
            Documentos asociados a esta solicitud de servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay documentos adjuntos aún
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Los documentos subidos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, _index) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${DOCUMENT_TYPE_COLORS[doc.type]}`}
                        >
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.uploadedAt.toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}