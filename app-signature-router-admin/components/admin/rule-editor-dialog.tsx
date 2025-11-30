'use client';

import { useState, useEffect } from 'react';
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
import { CheckCircle2, XCircle, AlertCircle, Code, Lightbulb } from 'lucide-react';

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
}

export function RuleEditorDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: RuleEditorDialogProps) {
  const [spelValidation, setSpelValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

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

  // Validar SpEL en tiempo real (simulado)
  useEffect(() => {
    if (condition.length > 0) {
      // Simular validación SpEL
      const timer = setTimeout(() => {
        validateSpEL(condition);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSpelValidation(null);
    }
  }, [condition]);

  const validateSpEL = (expression: string) => {
    // Simulación de validación SpEL
    // En producción, esto haría una llamada al backend
    const hasValidSyntax = !expression.includes('==') || expression.split('==').length === 2;
    const hasValidVariables = /^[a-zA-Z0-9\s.'"()!=<>&|]+$/.test(expression);
    
    if (!hasValidSyntax || !hasValidVariables) {
      setSpelValidation({
        isValid: false,
        message: 'Sintaxis SpEL inválida. Verifica los operadores y variables.',
      });
    } else {
      setSpelValidation({
        isValid: true,
        message: 'Sintaxis SpEL válida ✓',
      });
    }
  };

  const onSubmit = (data: RuleFormValues) => {
    onSave(data);
    reset();
    onOpenChange(false);
  };

  const spelExamples = [
    {
      name: 'Cliente Premium SMS',
      code: "customer.tier == 'PREMIUM' && channel == 'SMS'",
    },
    {
      name: 'Alta Prioridad Push',
      code: "channel == 'PUSH' && priority == 'HIGH'",
    },
    {
      name: 'Fallback Voice',
      code: "channel == 'VOICE' && provider.primary.status == 'DOWN'",
    },
    {
      name: 'Horario No Laboral',
      code: 'time.hour < 8 || time.hour > 20',
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
                value={watch('provider')}
                onValueChange={(value) => setValue('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Twilio">Twilio</SelectItem>
                  <SelectItem value="OneSignal">OneSignal</SelectItem>
                  <SelectItem value="Vonage">Vonage</SelectItem>
                  <SelectItem value="BioCatch">BioCatch</SelectItem>
                  <SelectItem value="AWS SNS">AWS SNS</SelectItem>
                  <SelectItem value="AWS Connect">AWS Connect</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="customer.tier == 'PREMIUM' && channel == 'SMS'"
                rows={4}
                className="font-mono text-sm"
                {...register('condition')}
              />
              {spelValidation && (
                <div className="absolute top-2 right-2">
                  {spelValidation.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
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
                customer.tier
              </Badge>
              <Badge variant="outline">
                customer.id
              </Badge>
              <Badge variant="outline">
                channel
              </Badge>
              <Badge variant="outline">
                priority
              </Badge>
              <Badge variant="outline">
                provider.primary.status
              </Badge>
              <Badge variant="outline">
                time.hour
              </Badge>
              <Badge variant="outline">
                time.dayOfWeek
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

