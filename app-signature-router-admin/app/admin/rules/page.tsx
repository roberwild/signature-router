'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Pause,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Code,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { RuleEditorDialog } from '@/components/admin/rule-editor-dialog';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { RoutingRule, CreateRuleDto, UpdateRuleDto } from '@/lib/api/types';

// Interfaz extendida para UI (incluye campos opcionales de métricas)
interface RuleWithMetrics extends RoutingRule {
  executionCount?: number;
  successRate?: number;
  provider?: string;
  channel?: string;
}

export default function RoutingRulesPage() {
  const { apiClient, isAuthenticated, isLoading: authLoading, redirectToLogin } = useApiClientWithStatus({ autoRedirect: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleWithMetrics | undefined>();
  const [rules, setRules] = useState<RuleWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [providerNameToIdMap, setProviderNameToIdMap] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<Array<{ id: string; name: string; type: string }>>([]);

  // Cargar proveedores y crear mapa nombre -> UUID
  const loadProviders = async () => {
    try {
      const response = await apiClient.getProviders();
      const nameToIdMap: Record<string, string> = {};
      const providersList: Array<{ id: string; name: string; type: string }> = [];
      
      response.providers.forEach((p: any) => {
        nameToIdMap[p.provider_name] = p.id;
        providersList.push({
          id: p.id,
          name: p.provider_name,
          type: p.provider_type,
        });
      });
      
      setProviderNameToIdMap(nameToIdMap);
      setProviders(providersList);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  };

  // Cargar reglas desde el backend
  const loadRules = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRules();
      // Mapear datos del backend a la interfaz de UI
      const rulesWithMetrics: RuleWithMetrics[] = data.map(rule => ({
        ...rule,
        channel: rule.targetChannel,
        executionCount: 0, // El backend no proporciona esto aún
        successRate: 0, // El backend no proporciona esto aún
      }));
      setRules(rulesWithMetrics);
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('Error al cargar reglas de routing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProviders();
      loadRules();
    }
  }, [isAuthenticated]);

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: RuleWithMetrics) => {
    // Convertir providerId (UUID) a nombre de proveedor
    let providerName = 'Twilio'; // Default
    if (rule.providerId) {
      // Buscar el nombre del proveedor por su UUID
      const providerEntry = Object.entries(providerNameToIdMap).find(([name, id]) => id === rule.providerId);
      if (providerEntry) {
        providerName = providerEntry[0];
      }
    }
    
    // Mapear targetChannel a channel para el formulario
    setEditingRule({
      ...rule,
      channel: rule.targetChannel,
      provider: providerName, // Nombre del proveedor (no UUID)
    });
    setDialogOpen(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      setActionLoading(id);
      try {
        await apiClient.deleteRule(id);
        setRules(rules.filter(rule => rule.id !== id));
      } catch (err) {
        console.error('Error deleting rule:', err);
        alert('Error al eliminar la regla');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    setActionLoading('save');
    try {
      // Convertir nombre de proveedor a UUID
      const providerId = ruleData.provider ? providerNameToIdMap[ruleData.provider] : undefined;
      
      console.log('🔍 DEBUG handleSaveRule:');
      console.log('  - ruleData.provider (nombre):', ruleData.provider);
      console.log('  - providerNameToIdMap:', providerNameToIdMap);
      console.log('  - providerId (UUID):', providerId);
      
      if (editingRule) {
        // Editar regla existente
        const updateDto: UpdateRuleDto = {
          name: ruleData.name,
          description: ruleData.description,
          priority: ruleData.priority,
          condition: ruleData.condition,
          targetChannel: ruleData.channel || ruleData.targetChannel,
          providerId: providerId, // UUID del proveedor (convertido desde nombre)
          enabled: ruleData.enabled,
        };
        const updated = await apiClient.updateRule(editingRule.id, updateDto);
        setRules(rules.map(rule =>
          rule.id === editingRule.id
            ? { ...updated, channel: updated.targetChannel, provider: updated.providerId, executionCount: rule.executionCount, successRate: rule.successRate }
            : rule
        ));
      } else {
        // Crear nueva regla
        const createDto: CreateRuleDto = {
          name: ruleData.name,
          description: ruleData.description,
          priority: ruleData.priority || rules.length + 1,
          condition: ruleData.condition,
          targetChannel: ruleData.channel || ruleData.targetChannel,
          providerId: providerId, // UUID del proveedor (convertido desde nombre)
          enabled: ruleData.enabled ?? true,
        };
        const created = await apiClient.createRule(createDto);
        setRules([...rules, { ...created, channel: created.targetChannel, provider: created.providerId, executionCount: 0, successRate: 0 }]);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving rule:', err);
      alert('Error al guardar la regla');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    setActionLoading(id);
    try {
      const updated = await apiClient.toggleRule(id, !rule.enabled);
      setRules(rules.map(r => 
        r.id === id ? { ...r, enabled: updated.enabled } : r
      ));
    } catch (err) {
      console.error('Error toggling rule:', err);
      alert('Error al cambiar estado de la regla');
    } finally {
      setActionLoading(null);
    }
  };

  const moveRule = async (id: string, direction: 'up' | 'down') => {
    const index = rules.findIndex(r => r.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === rules.length - 1)
    ) {
      return;
    }

    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[targetIndex]] = [newRules[targetIndex], newRules[index]];
    
    // Actualizar prioridades localmente
    newRules.forEach((rule, idx) => {
      rule.priority = idx + 1;
    });
    
    setRules(newRules);

    // Actualizar en el backend - enviar todos los campos requeridos
    try {
      // Convertir nombre de proveedor a UUID si existe
      const rule1 = newRules[index];
      const rule2 = newRules[targetIndex];
      
      const providerId1 = rule1.provider ? providerNameToIdMap[rule1.provider] : rule1.providerId;
      const providerId2 = rule2.provider ? providerNameToIdMap[rule2.provider] : rule2.providerId;
      
      await apiClient.updateRule(rule1.id, {
        name: rule1.name,
        description: rule1.description || '',
        condition: rule1.condition,
        targetChannel: rule1.targetChannel,
        providerId: providerId1,
        priority: rule1.priority,
        enabled: rule1.enabled,
      });
      
      await apiClient.updateRule(rule2.id, {
        name: rule2.name,
        description: rule2.description || '',
        condition: rule2.condition,
        targetChannel: rule2.targetChannel,
        providerId: providerId2,
        priority: rule2.priority,
        enabled: rule2.enabled,
      });
    } catch (err) {
      console.error('Error updating priorities:', err);
      // Recargar reglas si falla
      loadRules();
    }
  };

  const getChannelColor = (channel?: string) => {
    const colors: Record<string, string> = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-300',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300',
    };
    return colors[channel || ''] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const activeRules = rules.filter(r => r.enabled).length;
  const inactiveRules = rules.filter(r => !r.enabled).length;

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - autoRedirect should handle this
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Redirigiendo al Login...</h2>
            <p className="text-muted-foreground mb-4">
              Tu sesión ha expirado. Redirigiendo automáticamente...
            </p>
            <Button onClick={redirectToLogin} variant="outline">
              Ir al Login ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Reglas de Routing"
                info="Gestión de reglas de enrutamiento de firmas"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadRules} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreateRule}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Regla
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reglas</p>
                  <p className="text-2xl font-bold">{rules.length}</p>
                </div>
                <Settings className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{activeRules}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactivas</p>
                  <p className="text-2xl font-bold text-gray-400">{inactiveRules}</p>
                </div>
                <Pause className="h-8 w-8 text-gray-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canales</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Set(rules.map(r => r.targetChannel)).size}
                  </p>
                </div>
                <Code className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Table */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Reglas Configuradas</CardTitle>
            <CardDescription>
              Las reglas se evalúan en orden de prioridad. Usa las flechas para reordenar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && rules.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando reglas...</span>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay reglas configuradas</p>
                <Button className="mt-4" onClick={handleCreateRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera regla
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Orden</TableHead>
                    <TableHead>Regla</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Condición SpEL</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.sort((a, b) => a.priority - b.priority).map((rule, index) => (
                    <TableRow key={rule.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm font-medium">{rule.priority}</span>
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => moveRule(rule.id, 'up')}
                              disabled={index === 0}
                              className="text-muted-foreground hover:text-primary disabled:opacity-30"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveRule(rule.id, 'down')}
                              disabled={index === rules.length - 1}
                              className="text-muted-foreground hover:text-primary disabled:opacity-30"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-xs text-muted-foreground">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getChannelColor(rule.targetChannel)}>
                          {rule.targetChannel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="relative rounded bg-muted px-2 py-1 font-mono text-xs">
                          {rule.condition.length > 40
                            ? `${rule.condition.substring(0, 40)}...`
                            : rule.condition}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                          disabled={actionLoading === rule.id}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEditRule(rule)}
                            disabled={actionLoading === rule.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={actionLoading === rule.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Sobre las Expresiones SpEL
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Las condiciones utilizan Spring Expression Language (SpEL). Variables disponibles:
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    transactionContext
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    customerId
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    channel
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    amount
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rule Editor Dialog */}
        <RuleEditorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          rule={editingRule}
          onSave={handleSaveRule}
          providers={providers}
        />
      </div>
    </div>
  );
}
