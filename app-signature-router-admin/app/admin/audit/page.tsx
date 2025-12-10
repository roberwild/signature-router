"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { useToast } from '@/components/ui/use-toast';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  username: string;
  operation: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

interface AuditStats {
  totalLogs: number;
  createOperations: number;
  updateOperations: number;
  deleteOperations: number;
  byEntityType: Record<string, number>;
}

interface FilterOptions {
  operations: string[];
  entityTypes: string[];
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters
  const [usernameFilter, setUsernameFilter] = useState('');
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  
  const { toast } = useToast();
  const { apiClient, isAuthenticated } = useApiClientWithStatus();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [currentPage, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsResponse, statsData, filtersData] = await Promise.all([
        apiClient.getAuditLogs(currentPage, 20),
        apiClient.getAuditStats(),
        apiClient.getAuditFilterOptions(),
      ]);

      setAuditLogs(logsResponse.content);
      setTotalPages(logsResponse.totalPages);
      setTotalElements(logsResponse.totalElements);
      setStats(statsData);
      setFilterOptions(filtersData);
    } catch (error) {
      console.error('Error loading audit data:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudieron cargar los datos de auditoría',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setCurrentPage(0);
    try {
      const response = await apiClient.searchAuditLogs({
        username: usernameFilter || undefined,
        operation: operationFilter && operationFilter !== 'ALL' ? operationFilter : undefined,
        entityType: entityTypeFilter && entityTypeFilter !== 'ALL' ? entityTypeFilter : undefined,
        page: 0,
        size: 20,
      });

      setAuditLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);

      toast({
        title: '✅ Búsqueda completa',
        description: `${response.totalElements} registros encontrados`,
      });
    } catch (error) {
      console.error('Error searching audit logs:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo realizar la búsqueda',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setUsernameFilter('');
    setOperationFilter('ALL');
    setEntityTypeFilter('ALL');
    setCurrentPage(0);
    loadData();
  };

  const getOperationBadge = (operation: string) => {
    const styles = {
      CREATE: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      UPDATE: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      DELETE: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      READ: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500',
      LOGIN: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600',
      LOGOUT: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600',
    };

    const icons = {
      CREATE: <CheckCircle2 className="h-3 w-3" />,
      UPDATE: <Activity className="h-3 w-3" />,
      DELETE: <XCircle className="h-3 w-3" />,
      READ: <Info className="h-3 w-3" />,
      LOGIN: <User className="h-3 w-3" />,
      LOGOUT: <User className="h-3 w-3" />,
    };

    return (
      <Badge className={styles[operation as keyof typeof styles] || 'bg-gray-500 text-white border-gray-500'}>
        <span className="flex items-center gap-1">
          {icons[operation as keyof typeof icons]} {operation}
        </span>
      </Badge>
    );
  };

  const getEntityTypeBadge = (entityType: string) => {
    const styles = {
      PROVIDER: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600',
      ROUTING_RULE: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600',
      USER_PROFILE: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600',
      USER: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600',
      SIGNATURE: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
      OTHER: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500',
    };

    return (
      <Badge variant="secondary" className={styles[entityType as keyof typeof styles] || 'bg-gray-500 text-white border-gray-500'}>
        {entityType.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <AdminPageTitle
            title="Auditoría Completa"
            info="Epic 17 - Comprehensive Audit Trail"
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Total de Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Creaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.createOperations.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Modificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.updateOperations.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Eliminaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deleteOperations.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Input
                placeholder="Buscar por usuario..."
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Operación</label>
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las operaciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {filterOptions?.operations.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Entidad</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {filterOptions?.entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} disabled={loading} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button onClick={handleClearFilters} variant="outline" disabled={loading}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registros de Auditoría
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {totalElements} registros totales
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getOperationBadge(log.operation)}
                    {getEntityTypeBadge(log.entityType)}
                    <span className="text-sm text-muted-foreground">
                      {log.entityName || log.entityId}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{log.username}</span>
                  </div>
                  <div className="text-muted-foreground">
                    IP: {log.ipAddress}
                  </div>
                  {log.success ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Exitoso
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      Fallido: {log.errorMessage}
                    </div>
                  )}
                </div>

                {log.changes && Object.keys(log.changes).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Ver cambios
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

