'use client';

import { Users, UserPlus, Shield, Mail, Calendar, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockUsers = [
  {
    id: '1',
    name: 'Roberto García',
    email: 'roberto.garcia@company.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2025-11-30 10:30',
  },
  {
    id: '2',
    name: 'María Rodríguez',
    email: 'maria.rodriguez@company.com',
    role: 'Operator',
    status: 'active',
    lastLogin: '2025-11-30 09:15',
  },
  {
    id: '3',
    name: 'Juan Martínez',
    email: 'juan.martinez@company.com',
    role: 'Viewer',
    status: 'active',
    lastLogin: '2025-11-29 16:45',
  },
  {
    id: '4',
    name: 'Ana López',
    email: 'ana.lopez@company.com',
    role: 'Operator',
    status: 'inactive',
    lastLogin: '2025-11-15 14:20',
  },
  {
    id: '5',
    name: 'Carlos Sánchez',
    email: 'carlos.sanchez@company.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2025-11-30 08:00',
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de usuarios y permisos del sistema
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

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
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12 este mes
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
            <div className="text-2xl font-bold">112</div>
            <p className="text-xs text-muted-foreground mt-1">
              88% del total
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
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">
              Con acceso completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sesiones Activas
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground mt-1">
              En este momento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Gestiona los usuarios y sus permisos de acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{user.name}</h4>
                      <Badge
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className={
                          user.status === 'active'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-500 hover:bg-gray-600'
                        }
                      >
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Último acceso: {user.lastLogin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Editar Permisos</DropdownMenuItem>
                    <DropdownMenuItem>Cambiar Rol</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      {user.status === 'active' ? 'Desactivar' : 'Activar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Eliminar Usuario
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
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
                <Badge>8 usuarios</Badge>
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
                <Badge variant="secondary">87 usuarios</Badge>
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
                <Badge variant="outline">32 usuarios</Badge>
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

      {/* Placeholder Notice */}
      <Card className="border-dashed border-2 bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Página en Desarrollo</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Esta es una versión preliminar de la página de Usuarios. 
              Las funcionalidades completas (CRUD de usuarios, gestión de roles, etc.) se implementarán en la siguiente iteración.
            </p>
            <Badge variant="secondary" className="mt-2">Epic 6 - Pendiente de Integración</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

