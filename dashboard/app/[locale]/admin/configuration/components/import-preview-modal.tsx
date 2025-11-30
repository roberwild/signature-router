'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, FileJson } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { toast } from 'sonner';

interface ImportConfig {
  key: string;
  value: string;
  category: string;
  status: 'new' | 'updated' | 'unchanged' | 'skipped';
  currentValue?: string;
  newValue?: string;
  reason?: string;
}

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
  configurations: ImportConfig[];
}

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewData: ImportPreviewData | null;
  importData: Record<string, unknown>;
  onImport: (selectedKeys: string[]) => Promise<void>;
}

const statusConfig = {
  new: {
    label: 'New',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600'
  },
  updated: {
    label: 'Update',
    variant: 'secondary' as const,
    icon: AlertCircle,
    color: 'text-blue-600'
  },
  unchanged: {
    label: 'No Change',
    variant: 'outline' as const,
    icon: AlertTriangle,
    color: 'text-gray-600'
  },
  skipped: {
    label: 'Skip',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600'
  }
};

export function ImportPreviewModal({
  open,
  onClose,
  previewData,
  importData: _importData,
  onImport
}: ImportPreviewModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  if (!previewData) return null;

  // Get importable configurations (exclude unchanged and skipped)
  const importableConfigs = previewData.configurations.filter(
    c => c.status === 'new' || c.status === 'updated'
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedKeys(new Set(importableConfigs.map(c => c.key)));
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectConfig = (key: string, checked: boolean) => {
    const newSelected = new Set(selectedKeys);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedKeys(newSelected);
    setSelectAll(newSelected.size === importableConfigs.length);
  };

  const handleImport = async () => {
    if (selectedKeys.size === 0) {
      toast.error('Please select at least one configuration to import');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(Array.from(selectedKeys));
      toast.success(`Successfully imported ${selectedKeys.size} configuration(s)`);
      onClose();
    } catch (_error) {
      toast.error('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import Configuration Preview
          </DialogTitle>
          <DialogDescription>
            Review the configurations that will be imported. Uncheck any items you don't want to import.
          </DialogDescription>
        </DialogHeader>

        {/* Import metadata */}
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Source:</span>{' '}
                <span className="font-medium">{previewData.metadata.environment || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Exported by:</span>{' '}
                <span className="font-medium">{previewData.metadata.exportedBy || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Export date:</span>{' '}
                <span className="font-medium">
                  {new Date(previewData.metadata.exportDate).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total configs:</span>{' '}
                <span className="font-medium">{previewData.metadata.configCount}</span>
              </div>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex gap-2">
            {previewData.summary.new > 0 && (
              <Badge variant="default">
                {previewData.summary.new} New
              </Badge>
            )}
            {previewData.summary.updated > 0 && (
              <Badge variant="secondary">
                {previewData.summary.updated} Updates
              </Badge>
            )}
            {previewData.summary.unchanged > 0 && (
              <Badge variant="outline">
                {previewData.summary.unchanged} Unchanged
              </Badge>
            )}
            {previewData.summary.skipped > 0 && (
              <Badge variant="destructive">
                {previewData.summary.skipped} Skipped
              </Badge>
            )}
          </div>

          {/* Select all checkbox */}
          {importableConfigs.length > 0 && (
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Select all importable configurations ({importableConfigs.length})
              </label>
            </div>
          )}

          {/* Configuration list */}
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              {previewData.configurations.map((config) => {
                const status = statusConfig[config.status];
                const StatusIcon = status.icon;
                const isImportable = config.status === 'new' || config.status === 'updated';
                const isSelected = selectedKeys.has(config.key);

                return (
                  <div
                    key={config.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isImportable ? 'bg-background' : 'bg-muted/50 opacity-75'
                    }`}
                  >
                    {isImportable && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectConfig(config.key, !!checked)}
                        className="mt-1"
                      />
                    )}
                    <StatusIcon className={`h-5 w-5 mt-1 ${status.color}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {config.key}
                        </code>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      
                      {config.status === 'new' && (
                        <p className="text-sm text-muted-foreground">
                          New value: <span className="font-mono">{config.newValue}</span>
                        </p>
                      )}
                      
                      {config.status === 'updated' && (
                        <div className="text-sm text-muted-foreground">
                          <p>Current: <span className="font-mono">{config.currentValue}</span></p>
                          <p>New: <span className="font-mono text-primary">{config.newValue}</span></p>
                        </div>
                      )}
                      
                      {config.status === 'skipped' && config.reason && (
                        <p className="text-sm text-destructive">{config.reason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {importableConfigs.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No configurations available to import. All configurations are either unchanged or cannot be imported.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedKeys.size === 0 || isImporting}
          >
            {isImporting ? 'Importing...' : `Import ${selectedKeys.size} Configuration(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}