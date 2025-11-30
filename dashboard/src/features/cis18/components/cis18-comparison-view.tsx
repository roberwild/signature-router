'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import { Progress } from '@workspace/ui/components/progress';

import { type CIS18Assessment, CIS18ControlNames } from '../types/cis18-types';
import { ScoreBadge } from './score-badge';

interface CIS18ComparisonViewProps {
  assessments: CIS18Assessment[];
  onClose?: () => void;
}

export function CIS18ComparisonView({ assessments, onClose: _onClose }: CIS18ComparisonViewProps) {
  const sortedAssessments = [...assessments].sort((a, b) => 
    new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
  );

  const [leftId, setLeftId] = useState(sortedAssessments[0]?.id || '');
  const [rightId, setRightId] = useState(sortedAssessments[1]?.id || '');

  const leftAssessment = assessments.find(a => a.id === leftId);
  const rightAssessment = assessments.find(a => a.id === rightId);

  if (!leftAssessment || !rightAssessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Se necesitan al menos 2 evaluaciones para comparar
          </p>
        </CardContent>
      </Card>
    );
  }

  const getDifference = (left: number | null, right: number | null) => {
    if (left === null || right === null) return null;
    return left - right;
  };

  const getDifferenceDisplay = (diff: number | null) => {
    if (diff === null) return { icon: null, text: '-', color: '' };
    if (diff > 0) return { 
      icon: <ArrowUp className="h-3 w-3" />, 
      text: `+${diff}%`, 
      color: 'text-green-600' 
    };
    if (diff < 0) return { 
      icon: <ArrowDown className="h-3 w-3" />, 
      text: `${diff}%`, 
      color: 'text-red-600' 
    };
    return { 
      icon: <Minus className="h-3 w-3" />, 
      text: '0%', 
      color: 'text-gray-500' 
    };
  };

  const controlGroups = {
    'Fundamentos': ['control1', 'control2', 'control3', 'control4', 'control5', 'control6'],
    'Controles Avanzados': ['control7', 'control8', 'control9', 'control10', 'control11', 'control12'],
    'Organizacionales': ['control13', 'control14', 'control15', 'control16', 'control17', 'control18'],
  };

  return (
    <div className="space-y-6">
      {/* Selection Header */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Evaluaciones</CardTitle>
          <CardDescription>
            Selecciona dos evaluaciones para comparar los resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primera Evaluación</label>
              <Select value={leftId} onValueChange={setLeftId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedAssessments.map(assessment => (
                    <SelectItem 
                      key={assessment.id} 
                      value={assessment.id}
                      disabled={assessment.id === rightId}
                    >
                      {new Date(assessment.assessmentDate).toLocaleDateString('es-ES')} - {assessment.totalScore}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Segunda Evaluación</label>
              <Select value={rightId} onValueChange={setRightId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedAssessments.map(assessment => (
                    <SelectItem 
                      key={assessment.id} 
                      value={assessment.id}
                      disabled={assessment.id === leftId}
                    >
                      {new Date(assessment.assessmentDate).toLocaleDateString('es-ES')} - {assessment.totalScore}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Puntuación General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                {new Date(leftAssessment.assessmentDate).toLocaleDateString('es-ES')}
              </p>
              <ScoreBadge score={leftAssessment.totalScore} />
              <p className="text-3xl font-bold">{leftAssessment.totalScore || 0}%</p>
            </div>
            <div className="flex items-center justify-center">
              {(() => {
                const diff = getDifference(leftAssessment.totalScore ?? null, rightAssessment.totalScore ?? null);
                const display = getDifferenceDisplay(diff);
                return (
                  <div className={`flex flex-col items-center ${display.color}`}>
                    {diff !== null && diff !== 0 && (
                      diff > 0 ? <TrendingUp className="h-8 w-8 mb-2" /> : <TrendingDown className="h-8 w-8 mb-2" />
                    )}
                    <span className="text-2xl font-bold">{display.text}</span>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                {new Date(rightAssessment.assessmentDate).toLocaleDateString('es-ES')}
              </p>
              <ScoreBadge score={rightAssessment.totalScore} />
              <p className="text-3xl font-bold">{rightAssessment.totalScore || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Control Comparison */}
      {Object.entries(controlGroups).map(([groupName, controls]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle>{groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {controls.map(controlKey => {
                const controlNumber = controlKey.replace('control', '');
                const leftScore = leftAssessment[controlKey as keyof CIS18Assessment] as number | null;
                const rightScore = rightAssessment[controlKey as keyof CIS18Assessment] as number | null;
                const diff = getDifference(leftScore, rightScore);
                const display = getDifferenceDisplay(diff);
                
                return (
                  <div key={controlKey} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">CIS-{controlNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {CIS18ControlNames[controlKey]}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 ${display.color}`}>
                        {display.icon}
                        <span className="text-sm font-medium">{display.text}</span>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Progress value={leftScore || 0} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12 text-right">{leftScore || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={rightScore || 0} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12 text-right">{rightScore || 0}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Cambios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Controles Mejorados</p>
              <p className="text-2xl font-bold text-green-600">
                {(Array.from({ length: 18 }, (_, i) => {
                  const key = `control${i + 1}` as keyof CIS18Assessment;
                  const diff = getDifference(
                    leftAssessment[key] as number | null,
                    rightAssessment[key] as number | null
                  );
                  return diff !== null && diff > 0 ? 1 : 0;
                }) as number[]).reduce((a: number, b: number) => a + b, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Sin Cambios</p>
              <p className="text-2xl font-bold text-gray-600">
                {(Array.from({ length: 18 }, (_, i) => {
                  const key = `control${i + 1}` as keyof CIS18Assessment;
                  const diff = getDifference(
                    leftAssessment[key] as number | null,
                    rightAssessment[key] as number | null
                  );
                  return diff === 0 ? 1 : 0;
                }) as number[]).reduce((a: number, b: number) => a + b, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Controles Empeorados</p>
              <p className="text-2xl font-bold text-red-600">
                {(Array.from({ length: 18 }, (_, i) => {
                  const key = `control${i + 1}` as keyof CIS18Assessment;
                  const diff = getDifference(
                    leftAssessment[key] as number | null,
                    rightAssessment[key] as number | null
                  );
                  return diff !== null && diff < 0 ? 1 : 0;
                }) as number[]).reduce((a: number, b: number) => a + b, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}