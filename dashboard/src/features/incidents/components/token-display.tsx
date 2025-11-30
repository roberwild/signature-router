'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { toast } from '@workspace/ui/components/sonner';

interface TokenDisplayProps {
  token: string;
  versionNumber: number;
  totalVersions: number;
}

export function TokenDisplay({ token, versionNumber, totalVersions }: TokenDisplayProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      toast.success('Token copiado', {
        description: 'El token ha sido copiado al portapapeles',
      });
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (_error) {
      toast.error('Error', {
        description: 'No se pudo copiar el token',
      });
    }
  };

  const copyVerificationLink = async () => {
    const url = `${window.location.origin}/verify/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success('Link copiado', {
        description: 'El link de verificación ha sido copiado',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_error) {
      toast.error('Error', {
        description: 'No se pudo copiar el link',
      });
    }
  };

  const openPublicPortal = () => {
    window.open(`/verify/${token}`, '_blank');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Token de Verificación</CardTitle>
            <CardDescription>
              Token único para verificación pública del incidente
            </CardDescription>
          </div>
          <Badge variant="outline">
            Versión {versionNumber} de {totalVersions}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Display */}
        <div className="flex items-center gap-2">
          <code className="flex-1 p-4 bg-background rounded-lg font-mono text-sm break-all border">
            {token}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={copyToken}
            className="shrink-0"
          >
            {copiedToken ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={copyVerificationLink}
            className="flex-1"
          >
            {copiedLink ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Link Copiado
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link de Verificación
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={openPublicPortal}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Portal Público
          </Button>
        </div>

        {/* Info Text */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• Este token permite la verificación pública del incidente sin autenticación</p>
          <p>• Cada actualización genera un nuevo token, pero los anteriores siguen funcionando</p>
          <p>• Comparte este token solo con auditores y autoridades autorizadas</p>
        </div>
      </CardContent>
    </Card>
  );
}