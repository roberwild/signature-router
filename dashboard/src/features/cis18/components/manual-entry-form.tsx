'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Slider } from '@workspace/ui/components/slider';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { ScoreBadge } from './score-badge';
import { CIS18ControlNames } from '../types/cis18-types';

interface ManualEntryFormProps {
  organizationId: string;
  userId: string;
  slug: string;
}

export function ManualEntryForm({ organizationId, userId, slug }: ManualEntryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    assessmentDate: string;
    [key: string]: number | string;
  }>({
    assessmentDate: new Date().toISOString().split('T')[0],
    control1: 50,
    control2: 50,
    control3: 50,
    control4: 50,
    control5: 50,
    control6: 50,
    control7: 50,
    control8: 50,
    control9: 50,
    control10: 50,
    control11: 50,
    control12: 50,
    control13: 50,
    control14: 50,
    control15: 50,
    control16: 50,
    control17: 50,
    control18: 50,
  });

  const calculateTotalScore = () => {
    let total = 0;
    for (let i = 1; i <= 18; i++) {
      const value = formData[`control${i}`];
      total += typeof value === 'number' ? value : 0;
    }
    return Math.round(total / 18);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/cis18', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          totalScore: calculateTotalScore(),
          importMethod: 'manual',
          createdBy: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la evaluación');
      }

      router.push(`/organizations/${slug}/cis-18`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('No se pudo guardar la evaluación. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const controlGroups = {
    'Gestión de Activos': ['control1', 'control2'],
    'Protección de Datos': ['control3', 'control11'],
    'Configuración Segura': ['control4', 'control12'],
    'Gestión de Accesos': ['control5', 'control6'],
    'Gestión de Vulnerabilidades': ['control7', 'control8'],
    'Defensa contra Malware': ['control9', 'control10'],
    'Monitoreo y Respuesta': ['control13', 'control17'],
    'Entrenamiento y Pruebas': ['control14', 'control18'],
    'Gestión de Proveedores': ['control15', 'control16'],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date and Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assessmentDate">Fecha de Evaluación</Label>
              <Input
                id="assessmentDate"
                type="date"
                required
                value={formData.assessmentDate}
                onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Puntuación Total</Label>
              <div className="flex items-center gap-2">
                <ScoreBadge score={calculateTotalScore()} />
                <span className="text-2xl font-bold">{calculateTotalScore()}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Groups */}
      {Object.entries(controlGroups).map(([category, controls]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>
              Ingresa las puntuaciones para cada control (0-100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {controls.map(controlKey => {
              const controlNumber = controlKey.replace('control', '');
              const controlName = CIS18ControlNames[controlKey];
              const value = typeof formData[controlKey] === 'number' ? formData[controlKey] as number : 0;
              
              return (
                <div key={controlKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={controlKey}>
                      <span className="font-semibold">CIS-{controlNumber}:</span> {controlName}
                    </Label>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={value} />
                      <span className="text-sm font-medium w-12 text-right">{value}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      id={controlKey}
                      min={0}
                      max={100}
                      step={5}
                      value={[value]}
                      onValueChange={(newValue) => 
                        setFormData({ ...formData, [controlKey]: newValue[0] })
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => {
                        const newValue = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setFormData({ ...formData, [controlKey]: newValue });
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/organizations/${slug}/cis-18`)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Evaluación
            </>
          )}
        </Button>
      </div>
    </form>
  );
}