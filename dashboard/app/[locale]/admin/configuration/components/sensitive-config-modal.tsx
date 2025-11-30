'use client';

import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Label } from '@workspace/ui/components/label';

interface SensitiveConfigModalProps {
  open: boolean;
  onClose: () => void;
  configKey: string;
  onSave: (value: string) => Promise<void>;
}

export function SensitiveConfigModal({
  open,
  onClose,
  configKey,
  onSave,
}: SensitiveConfigModalProps) {
  const [newValue, setNewValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!newValue.trim()) {
      setError('Value cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(newValue);
      setNewValue('');
      setShowValue(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setNewValue('');
      setShowValue(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Sensitive Configuration</DialogTitle>
          <DialogDescription>
            Update the value for <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{configKey}</code>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="value">New Value</Label>
            <div className="relative">
              <Input
                id="value"
                type={showValue ? 'text' : 'password'}
                placeholder="Enter new value"
                value={newValue}
                onChange={(e) => {
                  setNewValue(e.target.value);
                  setError(null);
                }}
                disabled={isSaving}
                className={error ? 'pr-10 border-destructive' : 'pr-10'}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowValue(!showValue)}
                disabled={isSaving}
              >
                {showValue ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-1">
              <strong>Important:</strong> Once saved, this value will be encrypted and permanently masked. 
              You will not be able to view the original value again.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !newValue.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Securely'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}