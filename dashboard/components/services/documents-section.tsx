'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Upload, 
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  Paperclip
} from 'lucide-react';
import { Card,  CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  uploadedByAdmin: boolean;
  createdAt: Date;
  uploadedByName?: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  requestStatus: string;
  canUpload?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) return FileImage;
  if (fileType.includes('video')) return FileVideo;
  if (fileType.includes('audio')) return FileAudio;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('zip') || fileType.includes('rar')) return FileArchive;
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function DocumentsSection({ documents, requestStatus, canUpload = false }: DocumentsSectionProps) {
  const [isUploading, _setIsUploading] = useState(false);

  const handleDownload = (doc: Document) => {
    // Create a temporary anchor element to trigger download
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handlePreview = (document: Document) => {
    // Open in new tab for preview
    window.open(document.fileUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Documentos</CardTitle>
              <p className="text-xs text-muted-foreground">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'} compartidos
              </p>
            </div>
          </div>
          {canUpload && requestStatus !== 'completed' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isUploading}
            >
              <Upload className="h-3.5 w-3.5" />
              Subir
            </Button>
          )}
        </div>
      </CardHeader>

      <div className="h-[400px]">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay documentos compartidos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Los documentos enviados por el equipo aparecerán aquí
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {documents.map((doc) => {
                const FileIcon = getFileIcon(doc.fileType);
                
                return (
                  <div
                    key={doc.id}
                    className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      doc.uploadedByAdmin 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <FileIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {doc.fileName}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: es })}
                            </span>
                            {doc.uploadedByAdmin && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                  De Minery
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handlePreview(doc)}
                            title="Ver documento"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleDownload(doc)}
                            title="Descargar documento"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}