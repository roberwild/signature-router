'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { ImportDialog } from './import-dialog';

interface ImportButtonProps {
  organizationId: string;
}

export function ImportButton({ organizationId }: ImportButtonProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setShowImportDialog(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Importar
      </Button>
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        organizationId={organizationId}
      />
    </>
  );
}