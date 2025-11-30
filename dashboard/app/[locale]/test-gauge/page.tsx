'use client';

import { useState } from 'react';
import { ScoreComparisonChart } from '~/src/features/assessments/components/score-comparison-chart';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

export default function TestGaugePage() {
  const [userScore, setUserScore] = useState(75);
  const [globalAverage, setGlobalAverage] = useState(60);
  const [previousScore, setPreviousScore] = useState(65);

  // Test cases presets
  const testCases = [
    { name: 'Ambos en 0%', user: 0, avg: 0, prev: 0 },
    { name: 'Ambos en 1%', user: 1, avg: 1, prev: 0 },
    { name: 'Usuario 25%, Media 60%', user: 25, avg: 60, prev: 20 },
    { name: 'Ambos en 50%', user: 50, avg: 50, prev: 50 },
    { name: 'Usuario 75%, Media 40%', user: 75, avg: 40, prev: 70 },
    { name: 'Ambos en 99%', user: 99, avg: 99, prev: 95 },
    { name: 'Ambos en 100%', user: 100, avg: 100, prev: 100 },
    { name: 'Valores negativos (debe clampar a 0)', user: -10, avg: -5, prev: 0 },
    { name: 'Valores > 100 (debe clampar a 100)', user: 150, avg: 120, prev: 100 },
  ];

  const applyTestCase = (testCase: typeof testCases[0]) => {
    setUserScore(testCase.user);
    setGlobalAverage(testCase.avg);
    setPreviousScore(testCase.prev);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test del Componente Gauge Semicircular</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Controles Manuales</h2>
            
            <div className="space-y-2">
              <Label htmlFor="userScore">Tu Puntuación: {userScore}%</Label>
              <Input
                id="userScore"
                type="range"
                min="-20"
                max="120"
                value={userScore}
                onChange={(e) => setUserScore(Number(e.target.value))}
                className="w-full"
              />
              <Input
                type="number"
                value={userScore}
                onChange={(e) => setUserScore(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="globalAverage">Media Global: {globalAverage}%</Label>
              <Input
                id="globalAverage"
                type="range"
                min="-20"
                max="120"
                value={globalAverage}
                onChange={(e) => setGlobalAverage(Number(e.target.value))}
                className="w-full"
              />
              <Input
                type="number"
                value={globalAverage}
                onChange={(e) => setGlobalAverage(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousScore">Puntuación Anterior: {previousScore}%</Label>
              <Input
                id="previousScore"
                type="range"
                min="0"
                max="100"
                value={previousScore}
                onChange={(e) => setPreviousScore(Number(e.target.value))}
                className="w-full"
              />
              <Input
                type="number"
                value={previousScore}
                onChange={(e) => setPreviousScore(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Casos de Prueba Predefinidos</h2>
            <div className="grid grid-cols-1 gap-2">
              {testCases.map((testCase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => applyTestCase(testCase)}
                  className="justify-start text-left"
                >
                  <span className="font-medium">{testCase.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    U: {testCase.user}% | M: {testCase.avg}%
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Valores actuales (después de clamping):</h3>
            <ul className="text-sm space-y-1">
              <li>Tu puntuación (clamped): {Math.min(Math.max(userScore, 0), 100)}%</li>
              <li>Media global (clamped): {Math.min(Math.max(globalAverage, 0), 100)}%</li>
              <li>Diferencia: {userScore - globalAverage}%</li>
              <li>Tendencia: {userScore - previousScore > 0 ? '↑' : userScore - previousScore < 0 ? '↓' : '='} {Math.abs(userScore - previousScore)}%</li>
            </ul>
          </div>
        </div>

        {/* Chart Preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vista Previa del Componente</h2>
          <div className="border rounded-lg p-4 bg-background">
            <ScoreComparisonChart
              value={userScore}
              average={globalAverage}
              previousValue={previousScore}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Comportamiento esperado:</h3>
            <ul className="text-sm space-y-1">
              <li>✓ Con 0%: No debe haber arco visible</li>
              <li>✓ Con 100%: El arco debe cubrir todo el semicírculo</li>
              <li>✓ El marcador blanco debe seguir tu puntuación</li>
              <li>✓ La línea punteada indica la media global</li>
              <li>✓ Los valores fuera de 0-100 se clampean automáticamente</li>
              <li>✓ Los arcos no deben solaparse de forma extraña</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}