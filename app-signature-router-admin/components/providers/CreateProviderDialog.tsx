"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { getApiClient } from "@/lib/api/client";

interface CreateProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProviderDialog({ open, onOpenChange, onSuccess }: CreateProviderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_type: "SMS",
    provider_name: "",
    provider_code: "",
    enabled: true,
    priority: 10,
    timeout_seconds: 5,
    retry_max_attempts: 3,
    config_json: "{}",
    vault_path: "",
  });

  const apiClient = getApiClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse config_json
      const configJson = JSON.parse(formData.config_json);

      await apiClient.createProvider({
        ...formData,
        config_json: configJson,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        provider_type: "SMS",
        provider_name: "",
        provider_code: "",
        enabled: true,
        priority: 10,
        timeout_seconds: 5,
        retry_max_attempts: 3,
        config_json: "{}",
        vault_path: "",
      });
    } catch (error) {
      console.error("Failed to create provider:", error);
      alert("Error creating provider. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Provider</DialogTitle>
          <DialogDescription>
            Add a new signature provider configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider Type */}
          <div className="space-y-2">
            <Label htmlFor="provider_type">Provider Type *</Label>
            <Select
              value={formData.provider_type}
              onValueChange={(value) => setFormData({ ...formData, provider_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="PUSH">PUSH</SelectItem>
                <SelectItem value="VOICE">VOICE</SelectItem>
                <SelectItem value="BIOMETRIC">BIOMETRIC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Name */}
          <div className="space-y-2">
            <Label htmlFor="provider_name">Provider Name *</Label>
            <Input
              id="provider_name"
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              placeholder="e.g., Twilio SMS Production"
              required
            />
          </div>

          {/* Provider Code */}
          <div className="space-y-2">
            <Label htmlFor="provider_code">Provider Code *</Label>
            <Input
              id="provider_code"
              value={formData.provider_code}
              onChange={(e) => setFormData({ ...formData, provider_code: e.target.value })}
              placeholder="e.g., twilio-sms-prod"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase alphanumeric with hyphens only
            </p>
          </div>

          {/* Vault Path */}
          <div className="space-y-2">
            <Label htmlFor="vault_path">Vault Path *</Label>
            <Input
              id="vault_path"
              value={formData.vault_path}
              onChange={(e) => setFormData({ ...formData, vault_path: e.target.value })}
              placeholder="secret/signature-router/providers/twilio-sms"
              required
            />
          </div>

          {/* Priority */}
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
              placeholder='{"api_url": "https://...", "timeout": 5}'
              rows={6}
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
            <Label htmlFor="enabled">Enable provider immediately</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

