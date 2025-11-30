'use client';

import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { toast } from 'sonner';
import { ImportPreviewModal } from './import-preview-modal';
import { useRouter } from 'next/navigation';

interface ImportPreviewData {
  metadata: {
    version: string;
    exportDate: string;
    environment?: string;
    exportedBy?: string;
    configCount: number;
  };
  summary: {
    total: number;
    new: number;
    updated: number;
    unchanged: number;
    skipped: number;
  };
  configurations: Array<{
    key: string;
    value: string;
    category: string;
    status: 'new' | 'updated' | 'unchanged' | 'skipped';
    currentValue?: string;
    newValue?: string;
    reason?: string;
  }>;
}

interface ImportExportButtonsProps {
  onImportSuccess?: () => void;
}

export function ImportExportButtons({ onImportSuccess }: ImportExportButtonsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ImportPreviewData | null>(null);
  const [importFileData, setImportFileData] = useState<Record<string, unknown> | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/config/export');
      
      if (!response.ok) {
        throw new Error('Failed to export configurations');
      }

      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.configurations.length} configurations`);
      if (data.metadata.sensitiveExcluded > 0) {
        toast.info(`${data.metadata.sensitiveExcluded} sensitive configurations were excluded from export`);
      }
    } catch (error) {
      toast.error('Failed to export configurations');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    // Read and parse file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Store the import data
        setImportFileData(data);

        // Get preview from API
        const response = await fetch('/api/admin/config/import/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to preview import');
        }

        const preview = await response.json();
        setImportPreviewData(preview as ImportPreviewData);
        setShowImportModal(true);

      } catch (error) {
        if (error instanceof SyntaxError) {
          toast.error('Invalid JSON file');
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to process import file');
        }
        console.error('Import preview error:', error);
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async (selectedKeys: string[]) => {
    if (!importFileData) {
      toast.error('No file data to import');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/config/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          configurations: importFileData.configurations,
          selectedKeys
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Import failed');
      }

      const result = await response.json();
      
      // Show results
      if (result.results.successful > 0) {
        toast.success(`Successfully imported ${result.results.successful} configuration(s)`);
        if (result.results.created > 0) {
          toast.info(`Created ${result.results.created} new configuration(s)`);
        }
        if (result.results.updated > 0) {
          toast.info(`Updated ${result.results.updated} existing configuration(s)`);
        }
      }
      
      if (result.results.failed > 0) {
        toast.error(`Failed to import ${result.results.failed} configuration(s)`);
      }

      // Refresh the page
      onImportSuccess?.();
      router.refresh();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
      throw error;
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <ImportPreviewModal
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportPreviewData(null);
          setImportFileData(null);
        }}
        previewData={importPreviewData}
        importData={importFileData || {}}
        onImport={handleImport}
      />
    </>
  );
}