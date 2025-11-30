'use client';

import { useState } from 'react';
import {
  FileSignature,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminPageTitle } from '@/components/admin/admin-page-title';

interface Signature {
  id: string;
  customerId: string;
  customerName: string;
  channel: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  provider: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'TIMEOUT';
  createdAt: string;
  completedAt?: string;
  responseTime?: number;
  attempts: number;
  fallbackUsed: boolean;
  errorMessage?: string;
}

export default function SignaturesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const signatures: Signature[] = [
    {
      id: 'SIG-2024-0001',
      customerId: 'CUST-45231',
      customerName: 'Juan Pérez',
      channel: 'SMS',
      provider: 'Twilio',
      status: 'SUCCESS',
      createdAt: '2024-11-29 14:32:15',
      completedAt: '2024-11-29 14:32:18',
      responseTime: 2.8,
      attempts: 1,
      fallbackUsed: false,
    },
    {
      id: 'SIG-2024-0002',
      customerId: 'CUST-45229',
      customerName: 'María García',
      channel: 'PUSH',
      provider: 'OneSignal',
      status: 'SUCCESS',
      createdAt: '2024-11-29 14:28:42',
      completedAt: '2024-11-29 14:28:44',
      responseTime: 1.2,
      attempts: 1,
      fallbackUsed: false,
    },
    {
      id: 'SIG-2024-0003',
      customerId: 'CUST-45227',
      customerName: 'Carlos Rodríguez',
      channel: 'VOICE',
      provider: 'AWS Connect',
      status: 'SUCCESS',
      createdAt: '2024-11-29 14:25:10',
      completedAt: '2024-11-29 14:25:28',
      responseTime: 18.2,
      attempts: 2,
      fallbackUsed: true,
    },
    {
      id: 'SIG-2024-0004',
      customerId: 'CUST-45225',
      customerName: 'Ana Martínez',
      channel: 'BIOMETRIC',
      provider: 'BioCatch',
      status: 'PENDING',
      createdAt: '2024-11-29 14:22:35',
      attempts: 1,
      fallbackUsed: false,
    },
    {
      id: 'SIG-2024-0005',
      customerId: 'CUST-45223',
      customerName: 'Luis Fernández',
      channel: 'SMS',
      provider: 'Twilio',
      status: 'FAILED',
      createdAt: '2024-11-29 14:18:52',
      completedAt: '2024-11-29 14:19:12',
      responseTime: 20.0,
      attempts: 3,
      fallbackUsed: true,
      errorMessage: 'Maximum retry attempts exceeded',
    },
    {
      id: 'SIG-2024-0006',
      customerId: 'CUST-45221',
      customerName: 'Isabel Sánchez',
      channel: 'PUSH',
      provider: 'OneSignal',
      status: 'SUCCESS',
      createdAt: '2024-11-29 14:15:20',
      completedAt: '2024-11-29 14:15:22',
      responseTime: 1.5,
      attempts: 1,
      fallbackUsed: false,
    },
    {
      id: 'SIG-2024-0007',
      customerId: 'CUST-45219',
      customerName: 'Pedro Gómez',
      channel: 'SMS',
      provider: 'AWS SNS',
      status: 'SUCCESS',
      createdAt: '2024-11-29 14:12:45',
      completedAt: '2024-11-29 14:12:48',
      responseTime: 2.3,
      attempts: 1,
      fallbackUsed: false,
    },
    {
      id: 'SIG-2024-0008',
      customerId: 'CUST-45217',
      customerName: 'Laura Torres',
      channel: 'VOICE',
      provider: 'Vonage',
      status: 'TIMEOUT',
      createdAt: '2024-11-29 14:08:10',
      completedAt: '2024-11-29 14:08:40',
      responseTime: 30.0,
      attempts: 1,
      fallbackUsed: false,
      errorMessage: 'Request timeout after 30s',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      SUCCESS: { variant: 'default' as const, className: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2 },
      PENDING: { variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', icon: Clock },
      FAILED: { variant: 'destructive' as const, className: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle },
      TIMEOUT: { variant: 'destructive' as const, className: 'bg-orange-500/10 text-orange-700 border-orange-200', icon: AlertTriangle },
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
    };
    return (
      <Badge variant="outline" className={colors[channel as keyof typeof colors]}>
        {channel}
      </Badge>
    );
  };

  const filteredSignatures = signatures.filter((sig) => {
    const matchesSearch =
      sig.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sig.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sig.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sig.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: signatures.length,
    success: signatures.filter(s => s.status === 'SUCCESS').length,
    pending: signatures.filter(s => s.status === 'PENDING').length,
    failed: signatures.filter(s => s.status === 'FAILED' || s.status === 'TIMEOUT').length,
    avgResponseTime: signatures
      .filter(s => s.responseTime)
      .reduce((acc, s) => acc + (s.responseTime || 0), 0) / 
      signatures.filter(s => s.responseTime).length,
  };

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Monitoreo de Firmas"
                info="Seguimiento en tiempo real de solicitudes de firma"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Hoy</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileSignature className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Exitosas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                  <p className="text-xs text-muted-foreground">
                    {((stats.success / stats.total) * 100).toFixed(1)}%
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
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tiempo Resp.</p>
                  <p className="text-2xl font-bold">{stats.avgResponseTime.toFixed(1)}s</p>
                  <p className="text-xs text-muted-foreground">Promedio</p>
                </div>
                <RefreshCw className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID, Cliente..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('ALL')}
                  className={statusFilter === 'ALL' ? 'bg-primary' : ''}
                >
                  Todas
                </Button>
                <Button
                  variant={statusFilter === 'SUCCESS' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('SUCCESS')}
                  className={statusFilter === 'SUCCESS' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Exitosas
                </Button>
                <Button
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('PENDING')}
                  className={statusFilter === 'PENDING' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Pendientes
                </Button>
                <Button
                  variant={statusFilter === 'FAILED' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('FAILED')}
                  className={statusFilter === 'FAILED' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Fallidas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signatures Table */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Solicitudes de Firma</CardTitle>
            <CardDescription>
              Mostrando {filteredSignatures.length} de {signatures.length} solicitudes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Firma</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignatures.map((signature) => (
                  <TableRow key={signature.id}>
                    <TableCell>
                      <code className="text-xs font-mono font-medium">{signature.id}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{signature.customerName}</div>
                        <div className="text-xs text-muted-foreground">{signature.customerId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getChannelBadge(signature.channel)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{signature.provider}</span>
                        {signature.fallbackUsed && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-700 text-xs">
                            Fallback
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(signature.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{signature.createdAt}</div>
                    </TableCell>
                    <TableCell>
                      {signature.responseTime ? (
                        <span
                          className={`text-sm font-medium ${
                            signature.responseTime < 3
                              ? 'text-green-600'
                              : signature.responseTime < 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {signature.responseTime}s
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          signature.attempts > 1
                            ? 'bg-orange-500/10 text-orange-700 border-orange-200'
                            : ''
                        }
                      >
                        {signature.attempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

