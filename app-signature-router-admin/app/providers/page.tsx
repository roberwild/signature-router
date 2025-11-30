"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, TestTube, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { getApiClient } from "@/lib/api/client";

/**
 * Providers Management Page
 * Story 13.10: Admin UI - Providers Management Page
 * Epic 13: Providers CRUD Management
 * 
 * Features:
 * - List all providers with filters
 * - Create new provider
 * - Edit existing provider
 * - Delete (disable) provider
 * - Test provider connectivity
 * - View provider templates
 * - View provider audit history
 */

interface Provider {
  id: string;
  provider_type: "SMS" | "PUSH" | "VOICE" | "BIOMETRIC";
  provider_name: string;
  provider_code: string;
  enabled: boolean;
  priority: number;
  timeout_seconds: number;
  retry_max_attempts: number;
  config_json: Record<string, any>;
  vault_path: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "SMS" | "PUSH" | "VOICE" | "BIOMETRIC">("all");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "enabled" | "disabled">("all");

  const apiClient = getApiClient();

  useEffect(() => {
    loadProviders();
  }, [filter, enabledFilter]);

  async function loadProviders() {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      
      if (filter !== "all") {
        params.type = filter;
      }
      
      if (enabledFilter === "enabled") {
        params.enabled = true;
      } else if (enabledFilter === "disabled") {
        params.enabled = false;
      }

      const response = await apiClient.getProviders(params);
      setProviders(response.providers);
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setLoading(false);
    }
  }

  function getProviderTypeColor(type: string) {
    switch (type) {
      case "SMS":
        return "bg-blue-100 text-blue-800";
      case "PUSH":
        return "bg-green-100 text-green-800";
      case "VOICE":
        return "bg-purple-100 text-purple-800";
      case "BIOMETRIC":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Providers Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage signature provider configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Provider
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider Type</label>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "SMS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("SMS")}
                >
                  SMS
                </Button>
                <Button
                  variant={filter === "PUSH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("PUSH")}
                >
                  PUSH
                </Button>
                <Button
                  variant={filter === "VOICE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("VOICE")}
                >
                  VOICE
                </Button>
                <Button
                  variant={filter === "BIOMETRIC" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("BIOMETRIC")}
                >
                  BIOMETRIC
                </Button>
              </div>
            </div>

            {/* Enabled Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2">
                <Button
                  variant={enabledFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnabledFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={enabledFilter === "enabled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnabledFilter("enabled")}
                >
                  Enabled
                </Button>
                <Button
                  variant={enabledFilter === "disabled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnabledFilter("disabled")}
                >
                  Disabled
                </Button>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="ml-auto flex items-end">
              <Button variant="outline" size="sm" onClick={loadProviders}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No providers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{provider.provider_name}</CardTitle>
                      <Badge className={getProviderTypeColor(provider.provider_type)}>
                        {provider.provider_type}
                      </Badge>
                      {provider.enabled ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="mr-1 h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Code: <code className="text-xs bg-muted px-1 py-0.5 rounded">{provider.provider_code}</code>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <TestTube className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium">{provider.priority}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timeout</p>
                    <p className="font-medium">{provider.timeout_seconds}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Retries</p>
                    <p className="font-medium">{provider.retry_max_attempts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium">
                      {new Date(provider.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">Configuration</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(provider.config_json, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

