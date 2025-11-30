'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Shield, Copy, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { toast } from '@workspace/ui/components/sonner';

export function PublicTokenQueryForm(): React.JSX.Element {
  const [token, setToken] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanToken = token.trim();
    
    if (!cleanToken) {
      setError('Por favor ingrese un token');
      return;
    }

    // Validate token format (expecting 64 character hex string)
    if (cleanToken.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(cleanToken)) {
      setError('El token debe tener 64 caracteres hexadecimales');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, check if the token exists by calling the API
      const response = await fetch(`/api/verify/${cleanToken}`);
      
      if (response.ok) {
        toast.success('Token verificado', {
          description: 'Redirigiendo a los detalles del incidente...'
        });
        // Navigate to the verify token page
        router.push(`/verify/${cleanToken}`);
      } else if (response.status === 404) {
        setError('Token no encontrado. Por favor verifique que el token sea correcto.');
        toast.error('Token no encontrado', {
          description: 'Por favor verifique que el token sea correcto'
        });
      } else {
        setError('Error al verificar el token');
        toast.error('Error al verificar el token');
      }
    } catch (_err) {
      setError('Error al verificar el token');
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text.trim());
      toast.success('Token pegado desde el portapapeles');
    } catch (_err) {
      toast.error('No se pudo pegar desde el portapapeles');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Verificación de Token
            </CardTitle>
            <CardDescription className="mt-2">
              Ingrese el token único del incidente para acceder a su información
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="token" className="text-base font-semibold">
              Token del Incidente
            </Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="token"
                    type="text"
                    placeholder="Ingrese el token de 64 caracteres"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    className="h-12 font-mono text-sm pr-10"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={64}
                  />
                  {token && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {token.length === 64 ? (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePaste}
                  disabled={isLoading}
                  title="Pegar desde portapapeles"
                  className="h-12 w-12 hover:bg-primary/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 rounded-full bg-muted">
                  <div 
                    className="h-1 rounded-full bg-primary transition-all duration-300"
                    style={{ width: token ? `${(token.length / 64) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {token.length} / 64 caracteres
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              El token es un identificador único de 64 caracteres hexadecimales
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">Error de verificación</AlertTitle>
                <AlertDescription className="mt-1">
                  {error}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isLoading || !token.trim()}
              size="lg"
              className="flex-1 h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Verificar Token
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="rounded-full bg-primary/10 p-1">
              <Search className="h-3 w-3 text-primary" />
            </span>
            ¿Dónde encontrar el token?
          </h4>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span>En el correo de notificación del incidente</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span>En el enlace de verificación proporcionado</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span>En comunicaciones oficiales sobre el incidente</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}