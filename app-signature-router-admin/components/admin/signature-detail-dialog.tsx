'use client';

import { SignatureRequest, SignatureChallenge } from '@/lib/api/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RoutingTimeline } from './routing-timeline';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileSignature,
  User,
  DollarSign,
  Calendar,
  Timer,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { formatDistanceToNow, parseISO, format, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';

interface SignatureDetailDialogProps {
  signature: SignatureRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignatureDetailDialog({ signature, open, onOpenChange }: SignatureDetailDialogProps) {
  if (!signature) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      SIGNED: { className: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2, label: 'Firmada' },
      PENDING: { className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pendiente' },
      SENT: { className: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Activity, label: 'Enviada' },
      FAILED: { className: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle, label: 'Fallida' },
      EXPIRED: { className: 'bg-orange-500/10 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Expirada' },
      ABORTED: { className: 'bg-gray-500/10 text-gray-700 border-gray-200', icon: XCircle, label: 'Abortada' },
    };
    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getChallengeStatusBadge = (status: string) => {
    const variants = {
      COMPLETED: { className: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2 },
      PENDING: { className: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', icon: Clock },
      SENT: { className: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Activity },
      FAILED: { className: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle },
      EXPIRED: { className: 'bg-orange-500/10 text-orange-700 border-orange-200', icon: AlertTriangle },
    };
    const config = variants[status as keyof typeof variants] || variants.PENDING;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
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

  const calculateDuration = (start: string, end?: string): string => {
    if (!end) return 'En progreso';
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const seconds = differenceInSeconds(endDate, startDate);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const signatureDuration = signature.signedAt
    ? calculateDuration(signature.createdAt, signature.signedAt)
    : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Detalles de Firma {signature.id}
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud de firma y su timeline de auditoría
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    {getStatusBadge(signature.status)}
                  </div>
                  {signature.abortReason && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Motivo Aborto:</span>
                      <Badge variant="outline" className="bg-red-500/10 text-red-700">
                        {signature.abortReason.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  Tiempos de Procesamiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duración Total:</span>
                    <span className="text-sm font-mono font-medium">{signatureDuration}</span>
                  </div>
                  {signature.signedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Firmada:</span>
                      <span className="text-xs font-mono">
                        {format(parseISO(signature.signedAt), 'dd/MM/yyyy HH:mm:ss')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer and Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Información del Cliente y Transacción
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID Cliente</p>
                  <p className="text-sm font-mono font-medium">{signature.customerId}</p>
                </div>
                {signature.transactionContext?.orderId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                    <p className="text-sm font-mono">{signature.transactionContext.orderId}</p>
                  </div>
                )}
                {signature.transactionContext?.merchantId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Merchant ID</p>
                    <p className="text-sm font-mono">{signature.transactionContext.merchantId}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {signature.transactionContext?.amount && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monto</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">
                        {signature.transactionContext.amount.currency} {parseFloat(signature.transactionContext.amount.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {signature.transactionContext?.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm">{signature.transactionContext.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Creada</p>
                  <p className="text-sm font-mono">
                    {format(parseISO(signature.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(signature.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Expira</p>
                  <p className="text-sm font-mono">
                    {format(parseISO(signature.expiresAt), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(signature.expiresAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {signature.signedAt && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Firmada</p>
                    <p className="text-sm font-mono text-green-600">
                      {format(parseISO(signature.signedAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(signature.signedAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                )}
                {signature.abortedAt && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Abortada</p>
                    <p className="text-sm font-mono text-red-600">
                      {format(parseISO(signature.abortedAt), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(signature.abortedAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Challenges */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Desafíos de Autenticación ({signature.challenges?.length || 0})
            </h3>
            <div className="space-y-3">
              {(signature.challenges || []).map((challenge, index) => {
                const challengeDuration = challenge.completedAt
                  ? calculateDuration(challenge.sentAt || challenge.createdAt, challenge.completedAt)
                  : 'N/A';

                return (
                  <Card key={challenge.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Desafío #{index + 1}</span>
                              {getChannelBadge(challenge.channelType)}
                              {getChallengeStatusBadge(challenge.status)}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">{challenge.id}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {challenge.provider}
                          </Badge>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Enviado</p>
                            <p className="font-mono text-xs">
                              {challenge.sentAt
                                ? format(parseISO(challenge.sentAt), 'HH:mm:ss')
                                : 'N/A'}
                            </p>
                          </div>
                          {challenge.completedAt && (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Completado</p>
                                <p className="font-mono text-xs text-green-600">
                                  {format(parseISO(challenge.completedAt), 'HH:mm:ss')}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Tiempo Respuesta</p>
                                <p className="font-mono text-xs font-medium">{challengeDuration}</p>
                              </div>
                            </>
                          )}
                          {challenge.errorCode && (
                            <div className="md:col-span-3">
                              <p className="text-xs text-muted-foreground">Error</p>
                              <p className="text-xs text-red-600 font-mono">{challenge.errorCode}</p>
                            </div>
                          )}
                        </div>

                        {challenge.providerProof && (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs font-medium mb-2">Provider Proof</p>
                            <div className="grid gap-2 text-xs">
                              {challenge.providerProof.externalReference && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ref. Externa:</span>
                                  <span className="font-mono">{challenge.providerProof.externalReference}</span>
                                </div>
                              )}
                              {challenge.providerProof.responseCode && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Código:</span>
                                  <span className="font-mono">{challenge.providerProof.responseCode}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Routing Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Timeline de Routing ({signature.routingTimeline?.length || 0} eventos)
            </h3>
            <RoutingTimeline events={signature.routingTimeline || []} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
