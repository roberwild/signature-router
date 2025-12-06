'use client';

/**
 * Epic 13: Provider Management - MuleSoft Integration
 *
 * This page displays providers synchronized from MuleSoft ESB.
 * Admins can enable/disable providers and configure fallback priorities.
 *
 * Key Features:
 * - Sync providers from MuleSoft (auto every 5 min + manual)
 * - Enable/disable providers locally
 * - Configure fallback priorities (1-10)
 * - Real-time health status monitoring
 * - Provider metrics from MuleSoft
 *
 * Epic 13 Stories:
 * - Story 13.2: MuleSoft Client Integration
 * - Story 13.3: Provider Sync Service
 * - Story 13.4: REST API
 * - Story 13.5: Admin UI (this file)
 * - Story 13.6: Fallback Logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TestTube,
  BarChart3,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import { useToast } from '@/components/ui/use-toast';

// Types
interface ProviderCatalog {
  id: string;
  muleSoftProviderId: string;
  providerName: string;
  providerType: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  muleSoftEndpoint: string;
  muleSoftStatus: 'available' | 'configured' | 'down';
  enabled: boolean;
  priority: number;
  timeoutSeconds: number;
  retryMaxAttempts: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheckAt: string | null;
  lastHealthLatency?: number;
  lastSyncAt: string;
  // Metrics (from MuleSoft)
  requestsToday?: number;
  successRate?: number;
  avgLatency?: number;
  fallbackCount?: number;
  lastUsedAt?: string;
}

export default function ProvidersPageEpic13() {
  const { toast } = useToast();
  const { apiClient, isLoading: authLoading, isAuthenticated } = useApiClientWithStatus({ autoRedirect: true });

  const [providers, setProviders] = useState<ProviderCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const apiClientRef = useRef(apiClient);
  apiClientRef.current = apiClient;

  const initialLoadDone = useRef(false);

  // Load providers from backend
  const loadProviders = useCallback(async () => {
    const client = apiClientRef.current;

    try {
      // Epic 13 Story 13.4: GET /api/v1/admin/providers
      const response = await client.getProviderCatalog();

      setProviders(response.providers || []);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error loading providers:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los proveedores desde MuleSoft',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  // Epic 13 Story 13.3: Sync from MuleSoft
  const syncFromMuleSoft = async () => {
    setSyncing(true);

    try {
      // Epic 13 Story 13.4: POST /api/v1/admin/providers/sync
      await apiClient.syncProvidersFromMuleSoft();

      await loadProviders();

      toast({
        title: '✅ Sincronización Completa',
        description: `${providers.length} providers sincronizados desde MuleSoft`,
      });
    } catch (error) {
      toast({
        title: '❌ Error de Sincronización',
        description: 'No se pudo conectar con MuleSoft. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Epic 13 Story 13.4: Enable/Disable provider
  const toggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      const action = enabled ? 'enable' : 'disable';
      await apiClient.toggleProvider(providerId, action);

      await loadProviders();

      toast({
        title: enabled ? '✅ Provider Habilitado' : '⚠️ Provider Deshabilitado',
        description: enabled
          ? 'El provider está ahora activo para ruteo y health checks'
          : 'El provider fue deshabilitado. No se usará en el ruteo.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo cambiar el estado del provider',
        variant: 'destructive',
      });
    }
  };

  // Epic 13 Story 13.4: Update priority
  const updatePriority = async (providerId: string, priority: number) => {
    try {
      await apiClient.updateProviderPriority(providerId, priority);

      await loadProviders();

      toast({
        title: '✅ Prioridad Actualizada',
        description: `Prioridad cambiada a ${priority} ${priority === 1 ? '(Primary)' : '(Fallback)'}`,
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'No se pudo actualizar la prioridad',
        variant: 'destructive',
      });
    }
  };

  // Test provider connection
  const testProvider = async (providerId: string) => {
    try {
      const result = await apiClient.testProviderHealth(providerId);

      toast({
        title: result.healthy ? '✅ Test Exitoso' : '❌ Test Fallido',
        description: result.healthy
          ? `Provider respondió en ${result.latencyMs}ms`
          : `Error: ${result.error}`,
        variant: result.healthy ? 'default' : 'destructive',
      });

      await loadProviders();
    } catch (error) {
      toast({
        title: '❌ Test Fallido',
        description: 'No se pudo conectar con el provider',
        variant: 'destructive',
      });
    }
  };

  // Initial load
  useEffect(() => {
    if (authLoading || initialLoadDone.current) return;

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    initialLoadDone.current = true;
    setLoading(true);
    loadProviders().finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, loadProviders]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadProviders();
    }, 60000); // 1 min

    return () => clearInterval(interval);
  }, [isAuthenticated, loadProviders]);

  // Helper functions
  const getMuleSoftStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'configured':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'down':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getMuleSoftStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '🟢';
      case 'configured':
        return '🔵';
      case 'down':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'unhealthy':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'unknown':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'unhealthy':
        return '🔴';
      case 'unknown':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const toggleGroupCollapse = (type: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Group providers by type
  const groupedProviders = providers.reduce((acc, provider) => {
    if (!acc[provider.providerType]) {
      acc[provider.providerType] = [];
    }
    acc[provider.providerType].push(provider);
    return acc;
  }, {} as Record<string, ProviderCatalog[]>);

  // Calculate stats
  const stats = {
    total: providers.length,
    enabled: providers.filter(p => p.enabled).length,
    disabled: providers.filter(p => !p.enabled).length,
    healthy: providers.filter(p => p.healthStatus === 'healthy').length,
    unhealthy: providers.filter(p => p.healthStatus === 'unhealthy').length,
    unknown: providers.filter(p => p.healthStatus === 'unknown').length,
    lastSync: providers.length > 0
      ? providers.reduce((latest, p) => {
          const pDate = new Date(p.lastSyncAt);
          return pDate > latest ? pDate : latest;
        }, new Date(0))
      : null,
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando proveedores desde MuleSoft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Server className="h-6 w-6 text-primary" />
                <AdminPageTitle
                  title="Provider Management"
                  info="MuleSoft Integration - Epic 13"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last sync: {stats.lastSync ? formatRelativeTime(stats.lastSync.toISOString()) : 'Never'} |
                {' '}{stats.total} available |
                {' '}{stats.enabled} enabled |
                {' '}{stats.disabled} disabled
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={syncFromMuleSoft}
                disabled={syncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from MuleSoft'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">From MuleSoft</p>
                </div>
                <Server className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                  <p className="text-3xl font-bold text-green-600">{stats.enabled}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active for routing</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      🟢 {stats.healthy}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      🔴 {stats.unhealthy}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      ⚪ {stats.unknown}
                    </Badge>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                  <p className="text-2xl font-bold">
                    {stats.lastSync ? formatRelativeTime(stats.lastSync.toISOString()) : 'Never'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Auto-sync every 5 min</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Groups */}
        {Object.entries(groupedProviders).map(([type, typeProviders]) => {
          const icon = type === 'SMS' ? '📱' : type === 'PUSH' ? '🔔' : type === 'VOICE' ? '📞' : '🔐';
          const isCollapsed = collapsedGroups.has(type);

          return (
            <div key={type}>
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-card border rounded-t-lg cursor-pointer hover:bg-gray-100"
                onClick={() => toggleGroupCollapse(type)}
              >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>{icon}</span>
                  {type} Providers ({typeProviders.length})
                </h2>
                <Button variant="ghost" size="sm">
                  {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </Button>
              </div>

              {/* Provider Cards */}
              {!isCollapsed && (
                <div className="grid gap-4 lg:grid-cols-2 p-4 border border-t-0 rounded-b-lg bg-white dark:bg-background">
                  {typeProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onToggle={toggleProvider}
                      onPriorityChange={updatePriority}
                      onTest={testProvider}
                      getTypeColor={getTypeColor}
                      getMuleSoftStatusColor={getMuleSoftStatusColor}
                      getMuleSoftStatusIcon={getMuleSoftStatusIcon}
                      getHealthStatusColor={getHealthStatusColor}
                      getHealthStatusIcon={getHealthStatusIcon}
                      formatRelativeTime={formatRelativeTime}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {providers.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">
                No providers are configured in MuleSoft yet
              </p>
              <Button onClick={syncFromMuleSoft}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync from MuleSoft
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Provider Card Component
function ProviderCard({
  provider,
  onToggle,
  onPriorityChange,
  onTest,
  getTypeColor,
  getMuleSoftStatusColor,
  getMuleSoftStatusIcon,
  getHealthStatusColor,
  getHealthStatusIcon,
  formatRelativeTime,
}: {
  provider: ProviderCatalog;
  onToggle: (id: string, enabled: boolean) => void;
  onPriorityChange: (id: string, priority: number) => void;
  onTest: (id: string) => void;
  getTypeColor: (type: string) => string;
  getMuleSoftStatusColor: (status: string) => string;
  getMuleSoftStatusIcon: (status: string) => string;
  getHealthStatusColor: (status: string) => string;
  getHealthStatusIcon: (status: string) => string;
  formatRelativeTime: (date: string | null) => string;
}) {
  const canEnable = provider.muleSoftStatus !== 'down';
  const borderColor = provider.enabled ? 'border-l-green-500' : 'border-l-gray-300';

  return (
    <Card className={`border-l-4 ${borderColor} ${!provider.enabled ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {provider.providerName}
              <Badge variant="outline" className={getTypeColor(provider.providerType)}>
                {provider.providerType}
              </Badge>
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-1">
              {provider.muleSoftEndpoint}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">
              {provider.enabled ? 'ENABLED' : 'DISABLED'}
            </Label>
            <Switch
              checked={provider.enabled}
              onCheckedChange={(checked) => onToggle(provider.id, checked)}
              disabled={!canEnable}
            />
          </div>
        </div>

        {!canEnable && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <XCircle className="h-4 w-4" />
            <span>Provider is down in MuleSoft - Cannot enable</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Section */}
        <div className="rounded-lg border p-3 bg-gray-50 dark:bg-card">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">MuleSoft</p>
              <Badge variant="outline" className={getMuleSoftStatusColor(provider.muleSoftStatus)}>
                {getMuleSoftStatusIcon(provider.muleSoftStatus)} {provider.muleSoftStatus}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Health</p>
              <Badge variant="outline" className={getHealthStatusColor(provider.healthStatus)}>
                {getHealthStatusIcon(provider.healthStatus)} {provider.healthStatus}
                {provider.healthStatus === 'healthy' && provider.lastHealthLatency &&
                  ` (${provider.lastHealthLatency}ms)`
                }
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Provider ID</p>
              <p className="font-mono text-xs text-blue-600">{provider.muleSoftProviderId}</p>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="rounded-lg border p-3 bg-gray-50 dark:bg-card">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </h4>

          {/* Priority Slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Priority</Label>
              <span className="text-sm font-bold">{provider.priority}</span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[provider.priority]}
                min={1}
                max={10}
                step={1}
                onValueCommit={(value) => onPriorityChange(provider.id, value[0])}
                disabled={!provider.enabled}
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPriorityChange(provider.id, Math.max(1, provider.priority - 1))}
                  disabled={!provider.enabled || provider.priority === 1}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPriorityChange(provider.id, Math.min(10, provider.priority + 1))}
                  disabled={!provider.enabled || provider.priority === 10}
                >
                  ↓
                </Button>
              </div>
            </div>
            {provider.priority > 1 && provider.enabled && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Fallback provider (used when priority {provider.priority - 1} fails)
              </p>
            )}
          </div>

          {/* Timeout & Retries */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Timeout</p>
              <p className="font-semibold">{provider.timeoutSeconds}s</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Retries</p>
              <p className="font-semibold">{provider.retryMaxAttempts}</p>
            </div>
          </div>
        </div>

        {/* Metrics Section (if available) */}
        {provider.enabled && (provider.requestsToday !== undefined || provider.successRate !== undefined) && (
          <div className="rounded-lg border p-3 bg-gray-50 dark:bg-card">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics (Today)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Requests</p>
                <p className="text-xl font-bold">{provider.requestsToday?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {provider.successRate?.toFixed(1) || '0'}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Latency</p>
                <p className="text-xl font-bold">{provider.avgLatency || 0}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fallback Used</p>
                <p className="text-xl font-bold">{provider.fallbackCount || 0}</p>
              </div>
            </div>
            {provider.lastUsedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Last used: {formatRelativeTime(provider.lastUsedAt)}
              </p>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="rounded-lg border p-3 bg-gray-50 dark:bg-card">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timestamps
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <p>Last sync</p>
              <p className="font-semibold text-foreground">
                {formatRelativeTime(provider.lastSyncAt)}
              </p>
            </div>
            <div>
              <p>Last health check</p>
              <p className="font-semibold text-foreground">
                {provider.enabled
                  ? formatRelativeTime(provider.lastHealthCheckAt)
                  : 'Never (disabled)'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(provider.id)}
            disabled={!provider.enabled}
          >
            <TestTube className="mr-2 h-4 w-4" />
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/admin/metrics?provider=${provider.id}`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Metrics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/admin/providers/${provider.id}/configure`}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
