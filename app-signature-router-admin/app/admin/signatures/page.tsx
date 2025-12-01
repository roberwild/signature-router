'use client';

import { useState, useEffect } from 'react';
import {
  FileSignature,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  AlertTriangle,
  Ban,
  Send,
  Filter,
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
import { SignatureDetailDialog } from '@/components/admin/signature-detail-dialog';
import type { SignatureRequest } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  exportSignatureRequestsToCSV,
  exportSignatureRequestsWithTimeline,
  exportChallenges,
} from '@/lib/utils/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SignaturesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [signatures, setSignatures] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<SignatureRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadSignatures();
  }, [statusFilter, channelFilter, dateFrom, dateTo]);

  const loadSignatures = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }
      if (channelFilter !== 'ALL') {
        filters.channel = channelFilter;
      }
      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom).toISOString();
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filters.dateTo = endDate.toISOString();
      }

      const result = await apiClient.getSignatureRequests(Object.keys(filters).length > 0 ? filters : undefined);
      setSignatures(result.content);
    } catch (error) {
      console.error('Error loading signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  const handleViewDetails = async (signature: SignatureRequest) => {
    setSelectedSignature(signature);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      SIGNED: { className: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2 },
      PENDING: { className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', icon: Clock },
      SENT: { className: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Send },
      FAILED: { className: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle },
      EXPIRED: { className: 'bg-orange-500/10 text-orange-700 border-orange-200', icon: AlertTriangle },
      ABORTED: { className: 'bg-gray-500/10 text-gray-700 border-gray-200', icon: Ban },
    };
    const config = variants[status as keyof typeof variants] || variants.PENDING;
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

  const calculateDuration = (createdAt: string, completedAt?: string): string => {
    if (!completedAt) return '-';
    const start = parseISO(createdAt);
    const end = parseISO(completedAt);
    const seconds = differenceInSeconds(end, start);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredSignatures = signatures.filter((sig) => {
    const matchesSearch =
      sig.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sig.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: signatures.length,
    signed: signatures.filter(s => s.status === 'SIGNED').length,
    pending: signatures.filter(s => s.status === 'PENDING' || s.status === 'SENT').length,
    failed: signatures.filter(s => s.status === 'FAILED' || s.status === 'EXPIRED' || s.status === 'ABORTED').length,
    avgDuration: (() => {
      const completed = signatures.filter(s => s.signedAt);
      if (completed.length === 0) return 0;
      const totalSeconds = completed.reduce((acc, s) => {
        return acc + differenceInSeconds(parseISO(s.signedAt!), parseISO(s.createdAt));
      }, 0);
      return totalSeconds / completed.length;
    })(),
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
                info="Seguimiento en tiempo real con audit trail completo"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSignatures} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={signatures.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Formato de Exportación</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportSignatureRequestsToCSV(filteredSignatures)}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV - Firmas ({filteredSignatures.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSignatureRequestsWithTimeline(filteredSignatures)}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV - Con Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportChallenges(filteredSignatures)}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV - Desafíos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Firmadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? ((stats.signed / stats.total) * 100).toFixed(1) : 0}%
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
                  <p className="text-sm font-medium text-muted-foreground">Tiempo Prom.</p>
                  <p className="text-2xl font-bold">{stats.avgDuration.toFixed(1)}s</p>
                  <p className="text-xs text-muted-foreground">Duración</p>
                </div>
                <RefreshCw className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search and Status Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID o Cliente..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('ALL')}
                    size="sm"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={statusFilter === 'SIGNED' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('SIGNED')}
                    size="sm"
                    className={statusFilter === 'SIGNED' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Firmadas
                  </Button>
                  <Button
                    variant={statusFilter === 'SENT' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('SENT')}
                    size="sm"
                    className={statusFilter === 'SENT' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Enviadas
                  </Button>
                  <Button
                    variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('PENDING')}
                    size="sm"
                    className={statusFilter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    Pendientes
                  </Button>
                  <Button
                    variant={statusFilter === 'FAILED' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('FAILED')}
                    size="sm"
                    className={statusFilter === 'FAILED' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Fallidas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {showAdvancedFilters ? 'Ocultar' : 'Más Filtros'}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Channel Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Canal</label>
                      <div className="flex gap-2">
                        <Button
                          variant={channelFilter === 'ALL' ? 'default' : 'outline'}
                          onClick={() => setChannelFilter('ALL')}
                          size="sm"
                          className="flex-1"
                        >
                          Todos
                        </Button>
                        <Button
                          variant={channelFilter === 'SMS' ? 'default' : 'outline'}
                          onClick={() => setChannelFilter('SMS')}
                          size="sm"
                          className="flex-1"
                        >
                          SMS
                        </Button>
                        <Button
                          variant={channelFilter === 'PUSH' ? 'default' : 'outline'}
                          onClick={() => setChannelFilter('PUSH')}
                          size="sm"
                          className="flex-1"
                        >
                          PUSH
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={channelFilter === 'VOICE' ? 'default' : 'outline'}
                          onClick={() => setChannelFilter('VOICE')}
                          size="sm"
                          className="flex-1"
                        >
                          VOICE
                        </Button>
                        <Button
                          variant={channelFilter === 'BIOMETRIC' ? 'default' : 'outline'}
                          onClick={() => setChannelFilter('BIOMETRIC')}
                          size="sm"
                          className="flex-1"
                        >
                          BIOMETRIC
                        </Button>
                      </div>
                    </div>

                    {/* Date From */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Desde</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        max={dateTo || undefined}
                      />
                    </div>

                    {/* Date To */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hasta</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom || undefined}
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      disabled={statusFilter === 'ALL' && channelFilter === 'ALL' && !dateFrom && !dateTo && !searchTerm}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              )}
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
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignatures.map((signature) => {
                  const primaryChannel = signature.challenges[0]?.channelType || 'N/A';
                  const hasFallback = signature.challenges.length > 1;
                  const duration = calculateDuration(signature.createdAt, signature.signedAt);

                  return (
                    <TableRow key={signature.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleViewDetails(signature)}>
                      <TableCell>
                        <code className="text-xs font-mono font-medium">{signature.id}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{signature.customerId}</div>
                          <div className="text-xs text-muted-foreground">
                            {signature.transactionContext.transactionType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {signature.transactionContext.currency} {signature.transactionContext.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getChannelBadge(primaryChannel)}
                          {hasFallback && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-700 text-xs">
                              +Fallback
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(signature.status)}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {formatDistanceToNow(parseISO(signature.createdAt), { addSuffix: true, locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-mono ${duration !== '-' ? 'font-medium' : 'text-muted-foreground'}`}>
                          {duration}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {signature.routingTimeline.length} eventos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(signature);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredSignatures.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No se encontraron firmas</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando firmas...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <SignatureDetailDialog
        signature={selectedSignature}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
