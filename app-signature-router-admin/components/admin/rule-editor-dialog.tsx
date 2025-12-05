'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Code, Lightbulb, Loader2 } from 'lucide-react';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';

// Schema de validación
const ruleSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  channel: z.enum(['SMS', 'PUSH', 'VOICE', 'BIOMETRIC', 'ALL']),
  provider: z.string().min(1, 'Debes seleccionar un proveedor'),
  priority: z.number().min(1).max(100),
  condition: z.string().min(5, 'La condición SpEL es requerida'),
  enabled: z.boolean().default(true),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: Partial<RuleFormValues> & { id?: string };
  onSave: (rule: RuleFormValues) => void;
  providers?: Array<{ id: string; name: string; type: string }>;
}

export function RuleEditorDialog({
  open,
  onOpenChange,
  rule,
  onSave,
  providers = [],
}: RuleEditorDialogProps) {
  const { apiClient, isAuthenticated } = useApiClientWithStatus();
  const [spelValidation, setSpelValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const isEditing = !!rule?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule || {
      name: '',
      description: '',
      channel: 'SMS',
      provider: '',
      priority: 1,
      condition: '',
      enabled: true,
    },
  });

  const condition = watch('condition');
  const channel = watch('channel');
  const currentProvider = watch('provider');

  // Resetear el formulario y la validación SpEL cuando cambia la regla o se abre el diálogo
  useEffect(() => {
    if (open) {
      // Limpiar el estado de validación SpEL al abrir
      setSpelValidation(null);
      setIsValidating(false);
      
      if (rule) {
        const formValues = {
          name: rule.name || '',
          description: rule.description || '',
          channel: rule.channel || 'SMS',
          provider: rule.provider || getDefaultProvider(rule.channel),
          priority: rule.priority || 1,
          condition: rule.condition || '',
          enabled: rule.enabled !== undefined ? rule.enabled : true,
        };
        reset(formValues);
      } else {
        reset({
          name: '',
          description: '',
          channel: 'SMS',
          provider: '',
          priority: 1,
          condition: '',
          enabled: true,
        });
      }
    }
  }, [open, rule, reset]);

  // Función auxiliar para obtener proveedor por defecto según el canal
  const getDefaultProvider = (channel?: string) => {
    switch (channel) {
      case 'SMS':
        return 'Twilio';
      case 'PUSH':
        return 'OneSignal';
      case 'VOICE':
        return 'Vonage';
      case 'BIOMETRIC':
        return 'BioCatch';
      default:
        return 'Twilio';
    }
  };

  // Validar SpEL en tiempo real usando el backend (RULES-003)
  const validateSpEL = useCallback(async (expression: string) => {
    if (expression.length < 5) {
      setSpelValidation(null);
      return;
    }
    
    // No intentar validar si no hay sesión autenticada
    if (!isAuthenticated) {
      setSpelValidation({
        isValid: true,
        message: 'Validación pendiente (sesión no disponible)',
      });
      return;
    }
    
    setIsValidating(true);
    try {
      const result = await apiClient.validateSpel(expression);
      
      setSpelValidation({
        isValid: result.valid,
        message: result.valid 
          ? 'Sintaxis SpEL válida ✓' 
          : result.message || 'Expresión SpEL inválida',
      });
    } catch (error) {
      // Fallback a validación básica si el backend falla
      console.warn('SpEL validation failed, using local fallback:', error);
      
      // Verificar balanceo básico como fallback
      const openParens = (expression.match(/\(/g) || []).length;
      const closeParens = (expression.match(/\)/g) || []).length;
      const hasBalancedParens = openParens === closeParens;
      
      setSpelValidation({
        isValid: hasBalancedParens,
        message: hasBalancedParens 
          ? 'Validación local (backend no disponible)' 
          : 'Paréntesis no balanceados',
      });
    } finally {
      setIsValidating(false);
    }
  }, [isAuthenticated, apiClient]);

  useEffect(() => {
    if (condition.length > 0) {
      // Debounce para evitar demasiadas llamadas
      const timer = setTimeout(() => {
        validateSpEL(condition);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSpelValidation(null);
    }
  }, [condition, validateSpEL]);

  const onSubmit = (data: RuleFormValues) => {
    onSave(data);
    reset();
    onOpenChange(false);
  };

  const spelExamples = [
    {
      name: 'Transacciones Grandes',
      code: "amountValue > 1000",
    },
    {
      name: 'Merchant Específico',
      code: "merchantId == 'merchant-premium-001'",
    },
    {
      name: 'Monto y Currency',
      code: "amountValue >= 500 && amountCurrency == 'EUR'",
    },
    {
      name: 'Rango de Montos',
      code: "amountValue >= 100 && amountValue <= 1000",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Regla de Routing' : 'Nueva Regla de Routing'}
          </DialogTitle>
          <DialogDescription>
            Define las condiciones y el proveedor para enrutar solicitudes de firma
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre de la Regla <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="ej: SMS Premium Twilio"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe cuándo se debe aplicar esta regla..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Canal y Proveedor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel">
                Canal <span className="text-red-500">*</span>
              </Label>
              <Select
                value={channel}
                onValueChange={(value) => setValue('channel', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="PUSH">PUSH</SelectItem>
                  <SelectItem value="VOICE">VOICE</SelectItem>
                  <SelectItem value="BIOMETRIC">BIOMETRIC</SelectItem>
                  <SelectItem value="ALL">TODOS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">
                Proveedor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={currentProvider || ''}
                onValueChange={(value) => setValue('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor">
                    {currentProvider ? (
                      <>
                        {currentProvider}
                        {providers.find(p => p.name === currentProvider)?.type && 
                          ` (${providers.find(p => p.name === currentProvider)?.type})`}
                      </>
                    ) : (
                      'Selecciona un proveedor'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* Filtrar providers por canal seleccionado, pero siempre incluir el provider actual */}
                  {providers
                    .filter((provider) => {
                      // Siempre mostrar el provider actualmente seleccionado
                      if (provider.name === currentProvider) return true;
                      // Mostrar todos si el canal es ALL
                      if (channel === 'ALL') return true;
                      // Filtrar por tipo de canal
                      return provider.type === channel;
                    })
                    .map((provider) => {
                      // Mostrar ⚠️ solo si: es el provider actual, el canal no es ALL, y el tipo no coincide
                      const showMismatchWarning = provider.name === currentProvider && 
                                                  channel !== 'ALL' && 
                                                  provider.type !== channel;
                      return (
                        <SelectItem key={provider.id} value={provider.name}>
                          {provider.name} ({provider.type})
                          {showMismatchWarning && ' ⚠️'}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {providers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Cargando proveedores...
                </p>
              )}
              {channel !== 'ALL' && providers.filter(p => p.type === channel).length === 0 && providers.length > 0 && (
                <p className="text-xs text-amber-600">
                  No hay proveedores disponibles para el canal {channel}
                </p>
              )}
              {/* Advertencia si el provider actual no coincide con el canal */}
              {(() => {
                if (!currentProvider || channel === 'ALL' || providers.length === 0) return null;
                const selectedProvider = providers.find(p => p.name === currentProvider);
                if (!selectedProvider) return null; // Provider no encontrado en la lista
                if (selectedProvider.type === channel) return null; // Coincide correctamente
                return (
                  <p className="text-xs text-amber-600">
                    ⚠️ El proveedor seleccionado ({selectedProvider.type}) no coincide con el canal {channel}
                  </p>
                );
              })()}
              {errors.provider && (
                <p className="text-sm text-red-500">{errors.provider.message}</p>
              )}
            </div>
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              Prioridad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="100"
              {...register('priority', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Menor número = mayor prioridad (1-100)
            </p>
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
          </div>

          {/* Condición SpEL */}
          <div className="space-y-2">
            <Label htmlFor="condition">
              Condición SpEL <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="condition"
                placeholder="amountValue > 1000 && amountCurrency == 'EUR'"
                rows={4}
                className="font-mono text-sm"
                {...register('condition')}
              />
              <div className="absolute top-2 right-2">
                {isValidating ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : spelValidation ? (
                  spelValidation.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )
                ) : null}
              </div>
            </div>
            {errors.condition && (
              <p className="text-sm text-red-500">{errors.condition.message}</p>
            )}
            {spelValidation && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  spelValidation.isValid 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {spelValidation.isValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {spelValidation.message}
              </div>
            )}
          </div>

          {/* Variables disponibles */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Variables disponibles en SpEL
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                amountValue
              </Badge>
              <Badge variant="outline">
                amountCurrency
              </Badge>
              <Badge variant="outline">
                merchantId
              </Badge>
              <Badge variant="outline">
                orderId
              </Badge>
              <Badge variant="outline">
                description
              </Badge>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Ejemplos de condiciones SpEL
              </span>
            </div>
            <div className="space-y-2">
              {spelExamples.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setValue('condition', example.code)}
                  className="w-full text-left p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <div className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                    {example.name}
                  </div>
                  <code className="text-xs text-yellow-700 dark:text-yellow-300">{example.code}</code>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {isEditing ? 'Guardar Cambios' : 'Crear Regla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

