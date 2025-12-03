'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Mail, Calendar, MoreHorizontal, Info, RefreshCw, Eye, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { User } from '@/lib/api/types';

export default function UsersPage() {
  const { apiClient, isAuthenticated, isLoading: authLoading, redirectToLogin } = useApiClientWithStatus({ autoRedirect: true });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Cargar usuarios
  const loadUsers = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
      setLastSync(new Date());
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar usuarios desde Active Directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  // Filtrar usuarios por búsqueda
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.enabled).length;
  const adminUsers = users.filter(u => u.primaryRole === 'ADMIN').length;
  const operatorUsers = users.filter(u => u.primaryRole === 'OPERATOR').length;
  const viewerUsers = users.filter(u => u.primaryRole === 'VIEWER').length;

  const formatLastAccess = (lastAccess?: string) => {
    if (!lastAccess) return 'Nunca';
    const date = new Date(lastAccess);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'OPERATOR':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'VIEWER':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

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
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Usuarios</h1>
                <p className="text-sm text-muted-foreground">
                  Usuarios sincronizados desde Active Directory (Solo lectura)
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar desde AD
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl space-y-6 p-6">

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Active Directory Notice */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Usuarios gestionados desde Active Directory
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Los usuarios se sincronizan automáticamente desde Active Directory. 
                  Para crear, editar o eliminar usuarios, utiliza las herramientas de gestión de Active Directory. 
                  Los cambios se reflejarán automáticamente en este panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sincronizados desde AD
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administradores
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Con acceso completo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Operadores
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operatorUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Gestión operativa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">
            Última sincronización: {lastSync.toLocaleTimeString('es-ES')}
          </Badge>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Vista de solo lectura de usuarios sincronizados desde Active Directory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando usuarios desde AD...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios sincronizados'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{user.fullName || `${user.firstName} ${user.lastName}`}</h4>
                          <Badge
                            variant={user.enabled ? 'default' : 'secondary'}
                            className={user.enabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}
                          >
                            {user.enabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Badge className={getRoleBadgeColor(user.primaryRole)}>
                            {user.primaryRole}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.department && (
                            <span className="text-xs text-muted-foreground">
                              {user.department}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Último acceso: {formatLastAccess(user.lastAccess)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({user.loginCount} logins)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Solo lectura */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Información</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Perfil Completo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Ver Permisos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Historial de Accesos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                          Gestión desde Active Directory
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Roles y Permisos</CardTitle>
            <CardDescription>
              Configuración de roles disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Admin</h4>
                  <Badge>{adminUsers} usuarios</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Acceso completo a todas las funcionalidades del sistema
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Gestión de usuarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Configuración del sistema</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Gestión de providers</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Operator</h4>
                  <Badge variant="secondary">{operatorUsers} usuarios</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Operación diaria y monitoreo de firmas
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Ver firmas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Reintentar firmas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="line-through">Modificar reglas</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Viewer</h4>
                  <Badge variant="outline">{viewerUsers} usuarios</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Solo lectura y visualización de métricas
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Ver dashboards</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>Ver métricas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="line-through">Modificar datos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Info */}
        <Card className="border-dashed border-2 bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Integración con Active Directory</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Los usuarios y roles se sincronizan automáticamente desde Active Directory. 
                Para gestionar usuarios (crear, editar, desactivar), utiliza las herramientas de administración de Active Directory de tu organización.
                Los grupos de seguridad de AD se mapean automáticamente a roles en el sistema (Admin, Operator, Viewer).
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="secondary">
                  Última sincronización: {lastSync.toLocaleString('es-ES')}
                </Badge>
                <Badge variant="outline">Integración AD Activa</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
