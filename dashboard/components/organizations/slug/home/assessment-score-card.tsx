'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {  BarChart3, ArrowRight, Target, Award } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

interface AssessmentScoreCardProps {
  organizationId: string;
  organizationSlug: string;
}

interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  improvement: number;
}

export function AssessmentScoreCard({ organizationId, organizationSlug }: AssessmentScoreCardProps) {
  const [scores, _setScores] = useState({
    total: 72,
    previousTotal: 65,
    globalAverage: 68,
    categories: [
      { name: 'Personas', score: 75, maxScore: 100, improvement: 5 },
      { name: 'Procesos', score: 68, maxScore: 100, improvement: -2 },
      { name: 'Sistemas', score: 73, maxScore: 100, improvement: 8 },
    ] as CategoryScore[],
    lastAssessment: '2024-01-15',
    nextRecommended: '2024-04-15',
  });

  // TODO: Fetch real assessment data
  useEffect(() => {
    // Simulate data fetching
  }, [organizationId]);

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-green-600' };
    if (score >= 60) return { label: 'Bueno', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Mejorable', color: 'text-yellow-600' };
    return { label: 'Crítico', color: 'text-red-600' };
  };

  const scoreLevel = getScoreLevel(scores.total);
  const improvement = scores.total - scores.previousTotal;

  return (
    <Card className="relative overflow-hidden">
      {/* Achievement Badge */}
      {scores.total >= 80 && (
        <div className="absolute top-4 right-4">
          <Award className="h-8 w-8 text-yellow-500" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Evaluación de Ciberseguridad</CardTitle>
        </div>
        <CardDescription>
          Nivel de madurez en seguridad de tu organización
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className="text-center py-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-5xl font-bold">{scores.total}</div>
            <div className="absolute -right-8 top-0">
              {improvement > 0 ? (
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                  +{improvement}
                </Badge>
              ) : improvement < 0 ? (
                <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                  {improvement}
                </Badge>
              ) : null}
            </div>
          </div>
          <p className={cn("text-lg font-medium mt-2", scoreLevel.color)}>
            {scoreLevel.label}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Media del sector: {scores.globalAverage} puntos
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Desglose por Categorías</p>
          {scores.categories.map((category) => (
            <div key={category.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{category.score}%</span>
                  {category.improvement !== 0 && (
                    <span className={cn(
                      "text-xs",
                      category.improvement > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {category.improvement > 0 ? '+' : ''}{category.improvement}
                    </span>
                  )}
                </div>
              </div>
              <Progress 
                value={category.score} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {/* Comparison with Industry */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Posición en el sector</span>
          </div>
          <Badge variant={scores.total > scores.globalAverage ? "default" : "secondary"}>
            {scores.total > scores.globalAverage ? 'Por encima' : 'Por debajo'} de la media
          </Badge>
        </div>

        {/* Next Assessment Reminder */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Última evaluación: {new Date(scores.lastAssessment).toLocaleDateString('es-ES')}
          </p>
          <p className="text-xs text-muted-foreground">
            Próxima recomendada: {new Date(scores.nextRecommended).toLocaleDateString('es-ES')}
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/organizations/${organizationSlug}/assessments`} className="w-full">
          <Button variant="outline" className="w-full">
            Realizar nueva evaluación
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}