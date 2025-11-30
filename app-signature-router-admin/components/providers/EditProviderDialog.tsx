"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { getApiClient } from "@/lib/api/client";

interface Provider {
  id: string;
  provider_type: string;
  provider_name: string;
  provider_code: string;
  enabled: boolean;
  priority: number;
  timeout_seconds: number;
  retry_max_attempts: number;
  config_json: Record<string, any>;
  vault_path: string;
}

interface EditProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider | null;
  onSuccess: () => void;
}

export function EditProviderDialog({ open, onOpenChange, provider, onSuccess }: EditProviderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    enabled: true,
    priority: 10,
    timeout_seconds: 5,
    retry_max_attempts: 3,
    config_json: "{}",
    vault_path: "",
  });

  const apiClient = getApiClient();

  useEffect(() => {
    if (provider) {
      setFormData({
        provider_name: provider.provider_name,
        enabled: provider.enabled,
        priority: provider.priority,
        timeout_seconds: provider.timeout_seconds,
        retry_max_attempts: provider.retry_max_attempts,
        config_json: JSON.stringify(provider.config_json, null, 2),
        vault_path: provider.vault_path,
      });
    }
  }, [provider]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) return;

    setLoading(true);

    try {
      const configJson = JSON.parse(formData.config_json);

      await apiClient.updateProvider(provider.id, {
        ...formData,
        config_json: configJson,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update provider:", error);
      alert("Error updating provider. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Provider</DialogTitle>
          <DialogDescription>
            Update configuration for {provider.provider_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Name */}
          <div className="space-y-2">
            <Label htmlFor="provider_name">Provider Name *</Label>
            <Input
              id="provider_name"
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              required
            />
          </div>

          {/* Read-only fields */}
          <div className="space-y-2">
            <Label>Provider Type</Label>
            <Input value={provider.provider_type} disabled />
          </div>

          <div className="space-y-2">
            <Label>Provider Code</Label>
            <Input value={provider.provider_code} disabled />
          </div>

          {/* Vault Path */}
          <div className="space-y-2">
            <Label htmlFor="vault_path">Vault Path *</Label>
            <Input
              id="vault_path"
              value={formData.vault_path}
              onChange={(e) => setFormData({ ...formData, vault_path: e.target.value })}
              required
            />
          </div>

          {/* Priority, Timeout, Retries */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
              <Input
                id="timeout_seconds"
                type="number"
                min="1"
                max="60"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry_max_attempts">Max Retries</Label>
              <Input
                id="retry_max_attempts"
                type="number"
                min="0"
                max="5"
                value={formData.retry_max_attempts}
                onChange={(e) => setFormData({ ...formData, retry_max_attempts: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Config JSON */}
          <div className="space-y-2">
            <Label htmlFor="config_json">Configuration (JSON) *</Label>
            <Textarea
              id="config_json"
              value={formData.config_json}
              onChange={(e) => setFormData({ ...formData, config_json: e.target.value })}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Provider enabled</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

