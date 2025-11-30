'use client';

import { useState } from 'react';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Code,
  Info,
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

interface RoutingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  condition: string;
  channel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC' | 'ALL';
  provider: string;
  createdAt: string;
  lastModified: string;
  executionCount: number;
  successRate: number;
}

export default function RoutingRulesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | undefined>();
  const [rules, setRules] = useState<RoutingRule[]>([
    {
      id: '1',
      name: 'SMS Premium Twilio',
      description: 'Usar Twilio para clientes premium en SMS',
      priority: 1,
      enabled: true,
      condition: "customer.tier == 'PREMIUM' && channel == 'SMS'",
      channel: 'SMS',
      provider: 'Twilio',
      createdAt: '2024-01-15',
      lastModified: '2024-11-20',
      executionCount: 4521,
      successRate: 99.2,
    },
    {
      id: '2',
      name: 'PUSH Alta Disponibilidad',
      description: 'OneSignal para notificaciones push críticas',
      priority: 2,
      enabled: true,
      condition: "channel == 'PUSH' && priority == 'HIGH'",
      channel: 'PUSH',
      provider: 'OneSignal',
      createdAt: '2024-02-10',
      lastModified: '2024-11-18',
      executionCount: 2134,
      successRate: 98.5,
    },
    {
      id: '3',
      name: 'Voice Backup AWS',
      description: 'Fallback a AWS Connect para llamadas',
      priority: 3,
      enabled: true,
      condition: "channel == 'VOICE' && provider.primary.status == 'DOWN'",
      channel: 'VOICE',
      provider: 'AWS Connect',
      createdAt: '2024-03-05',
      lastModified: '2024-11-15',
      executionCount: 543,
      successRate: 97.8,
    },
    {
      id: '4',
      name: 'Biometric Default',
      description: 'BioCatch para autenticación biométrica',
      priority: 4,
      enabled: true,
      condition: "channel == 'BIOMETRIC'",
      channel: 'BIOMETRIC',
      provider: 'BioCatch',
      createdAt: '2024-04-12',
      lastModified: '2024-11-10',
      executionCount: 345,
      successRate: 99.7,
    },
    {
      id: '5',
      name: 'Horario No Laboral',
      description: 'SMS reducido en horarios off-peak',
      priority: 5,
      enabled: false,
      condition: "time.hour < 8 || time.hour > 20",
      channel: 'SMS',
      provider: 'AWS SNS',
      createdAt: '2024-05-20',
      lastModified: '2024-10-30',
      executionCount: 892,
      successRate: 96.5,
    },
  ]);

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: RoutingRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const handleSaveRule = (ruleData: any) => {
    if (editingRule) {
      // Editar regla existente
      setRules(rules.map(rule =>
        rule.id === editingRule.id
          ? { ...rule, ...ruleData, lastModified: new Date().toISOString().split('T')[0] }
          : rule
      ));
    } else {
      // Crear nueva regla
      const newRule: RoutingRule = {
        id: String(rules.length + 1),
        ...ruleData,
        createdAt: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        executionCount: 0,
        successRate: 0,
      };
      setRules([...rules, newRule]);
    }
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const moveRule = (id: string, direction: 'up' | 'down') => {
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
    
    // Actualizar prioridades
    newRules.forEach((rule, idx) => {
      rule.priority = idx + 1;
    });
    
    setRules(newRules);
  };

  const getChannelColor = (channel: string) => {
    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
      ALL: 'bg-gray-500/10 text-gray-700 border-gray-200',
    };
    return colors[channel as keyof typeof colors] || colors.ALL;
  };

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
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Regla
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
                  <p className="text-2xl font-bold text-green-600">
                    {rules.filter(r => r.enabled).length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-400">
                    {rules.filter(r => !r.enabled).length}
                  </p>
                </div>
                <Pause className="h-8 w-8 text-gray-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Éxito Promedio</p>
                  <p className="text-2xl font-bold text-primary">
                    {(rules.reduce((acc, r) => acc + r.successRate, 0) / rules.length).toFixed(1)}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Table */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Reglas Configuradas</CardTitle>
            <CardDescription>
              Las reglas se evalúan en orden de prioridad. Arrastra para reordenar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Orden</TableHead>
                  <TableHead>Regla</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Condición SpEL</TableHead>
                  <TableHead>Ejecuciones</TableHead>
                  <TableHead>Éxito</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, index) => (
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
                      <Badge variant="outline" className={getChannelColor(rule.channel)}>
                        {rule.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{rule.provider}</span>
                    </TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-2 py-1 font-mono text-xs">
                        {rule.condition.length > 40
                          ? `${rule.condition.substring(0, 40)}...`
                          : rule.condition}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{rule.executionCount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rule.successRate}%</span>
                        {rule.successRate >= 99 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : rule.successRate >= 95 ? (
                          <Info className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    customer
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    channel
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    priority
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    provider
                  </code>
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    time
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
        />
      </div>
    </div>
  );
}

