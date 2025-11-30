"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getApiClient } from "@/lib/api/client";

interface Provider {
  id: string;
  provider_name: string;
  provider_code: string;
}

interface DeleteProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider | null;
  onSuccess: () => void;
}

export function DeleteProviderDialog({ open, onOpenChange, provider, onSuccess }: DeleteProviderDialogProps) {
  const [loading, setLoading] = useState(false);
  const apiClient = getApiClient();

  async function handleDelete() {
    if (!provider) return;

    setLoading(true);

    try {
      await apiClient.deleteProvider(provider.id);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete provider:", error);
      alert("Error deleting provider. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Provider
          </DialogTitle>
          <DialogDescription>
            This action will disable the provider. Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{provider.provider_name}</p>
            <p className="text-xs text-muted-foreground">Code: {provider.provider_code}</p>
          </div>

          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This performs a soft delete (disables the provider).
              The configuration will remain in the database for audit purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

