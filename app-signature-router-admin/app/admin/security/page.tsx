'use client';

import { Shield, Lock, Key, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Seguridad</h1>
              <p className="text-sm text-muted-foreground">
                Gestión de seguridad, autenticación y control de acceso
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-7xl space-y-6 p-6">

      {/* Security Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado de Seguridad
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Seguro</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los controles activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Autenticación 2FA
            </CardTitle>
            <Lock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Activa</div>
            <p className="text-xs text-muted-foreground mt-1">
              85% de usuarios con 2FA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tokens Activos
            </CardTitle>
            <Key className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground mt-1">
              12 expiran hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Intentos Fallidos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuración de Autenticación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Autenticación
            </CardTitle>
            <CardDescription>
              Configuración de métodos de autenticación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">OAuth 2.0</p>
                <p className="text-xs text-muted-foreground">Autenticación principal</p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Verificación en dos pasos</p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">JWT Tokens</p>
                <p className="text-xs text-muted-foreground">Expiración: 24h</p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Políticas de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Políticas de Seguridad
            </CardTitle>
            <CardDescription>
              Reglas y políticas de acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Contraseña Fuerte</p>
                <p className="text-xs text-muted-foreground">Mínimo 12 caracteres</p>
              </div>
              <Badge variant="default">Obligatorio</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">IP Whitelisting</p>
                <p className="text-xs text-muted-foreground">45 IPs autorizadas</p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Rate Limiting</p>
                <p className="text-xs text-muted-foreground">100 req/min por usuario</p>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Auditoría de Acceso */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Auditoría de Acceso
            </CardTitle>
            <CardDescription>
              Últimos accesos y eventos de seguridad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">admin@company.com</p>
                  <p className="text-xs text-muted-foreground">Login exitoso desde 192.168.1.100</p>
                </div>
                <span className="text-xs text-muted-foreground">Hace 5 min</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">user@company.com</p>
                  <p className="text-xs text-muted-foreground">Intento fallido de login</p>
                </div>
                <span className="text-xs text-muted-foreground">Hace 12 min</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">security@company.com</p>
                  <p className="text-xs text-muted-foreground">Cambio de contraseña</p>
                </div>
                <span className="text-xs text-muted-foreground">Hace 1 hora</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Notice */}
      <Card className="border-dashed border-2 bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Página en Desarrollo</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Esta es una versión preliminar de la página de Seguridad. 
              Las funcionalidades completas se implementarán en la siguiente iteración.
            </p>
            <Badge variant="secondary" className="mt-2">Epic 6 - Pendiente de Integración</Badge>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

