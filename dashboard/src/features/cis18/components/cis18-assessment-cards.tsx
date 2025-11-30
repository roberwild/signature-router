'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  Edit2,
  Copy,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';

import { ScoreBadge } from './score-badge';
import { DeleteAssessmentButton } from './delete-assessment-button';
import { type CIS18Assessment, CIS18ControlNames } from '../types/cis18-types';

interface CIS18AssessmentCardsProps {
  data: CIS18Assessment[];
  organizationSlug?: string;
}

interface ControlGroup {
  name: string;
  controls: string[];
  icon: React.ReactNode;
}

const controlGroups: ControlGroup[] = [
  {
    name: 'Fundamentos',
    controls: ['control1', 'control2', 'control3', 'control4', 'control5', 'control6'],
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    name: 'Controles Avanzados',
    controls: ['control7', 'control8', 'control9', 'control10', 'control11', 'control12'],
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    name: 'Organizacionales',
    controls: ['control13', 'control14', 'control15', 'control16', 'control17', 'control18'],
    icon: <BarChart3 className="h-4 w-4" />
  }
];

function AssessmentCard({ 
  assessment, 
  previousAssessment,
  organizationSlug 
}: { 
  assessment: CIS18Assessment;
  previousAssessment?: CIS18Assessment;
  organizationSlug?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Calculate group scores
  const calculateGroupScore = (controls: string[]) => {
    let total = 0;
    let count = 0;
    controls.forEach(control => {
      const score = assessment[control as keyof CIS18Assessment] as number | null;
      if (score !== null && score !== undefined) {
        total += score;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  // Calculate trend
  const getTrend = () => {
    if (!previousAssessment) return null;
    const currentScore = assessment.totalScore || 0;
    const previousScore = previousAssessment.totalScore || 0;
    const difference = currentScore - previousScore;
    
    if (difference > 0) return { icon: <TrendingUp className="h-4 w-4" />, value: `+${difference}%`, color: 'text-green-600' };
    if (difference < 0) return { icon: <TrendingDown className="h-4 w-4" />, value: `${difference}%`, color: 'text-red-600' };
    return { icon: <Minus className="h-4 w-4" />, value: '0%', color: 'text-gray-500' };
  };

  const trend = getTrend();

  // Get top and bottom performing controls
  const getControlPerformance = () => {
    const controls = [];
    for (let i = 1; i <= 18; i++) {
      const key = `control${i}` as keyof CIS18Assessment;
      const score = assessment[key] as number | null;
      if (score !== null && score !== undefined) {
        controls.push({ key, score, name: CIS18ControlNames[key] });
      }
    }
    controls.sort((a, b) => b.score - a.score);
    return {
      top: controls.slice(0, 3),
      bottom: controls.slice(-3).reverse()
    };
  };

  const performance = getControlPerformance();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              Evaluación {new Date(assessment.assessmentDate).toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(assessment.assessmentDate).toLocaleDateString('es-ES')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              <div className={`flex items-center gap-1 ${trend.color}`}>
                {trend.icon}
                <span className="text-sm font-medium">{trend.value}</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="sr-only">Acciones</span>
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => organizationSlug && router.push(`/organizations/${organizationSlug}/cis-18/${assessment.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalles completos
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar evaluación
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar datos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(assessment.id)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <DeleteAssessmentButton
                    assessmentId={assessment.id}
                    assessmentDate={assessment.assessmentDate}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 min-w-0">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Puntuación Total</span>
            <div className="flex items-center gap-2">
              <ScoreBadge score={assessment.totalScore} />
              <span className="text-2xl font-bold">{assessment.totalScore || 0}%</span>
            </div>
          </div>
          <Progress value={assessment.totalScore || 0} className="h-2" />
        </div>

        {/* Group Scores Summary */}
        <div className="grid gap-3">
          {controlGroups.map((group) => {
            const score = calculateGroupScore(group.controls);
            return (
              <div key={group.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {group.icon}
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={score} className="w-24 h-2" />
                  <span className="text-sm font-semibold w-12 text-right">{score}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Highlights */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Mejores Controles</p>
            <div className="space-y-1">
              {performance.top.map((control, idx) => (
                <div key={control.key} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs truncate flex-1" title={control.name}>
                    {idx + 1}. {control.name}
                  </span>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{control.score}%</Badge>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Requieren Atención</p>
            <div className="space-y-1">
              {performance.bottom.map((control, idx) => (
                <div key={control.key} className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs truncate flex-1" title={control.name}>
                    {idx + 1}. {control.name}
                  </span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{control.score}%</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Ocultar todos los controles
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Ver todos los controles (18)
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              {controlGroups.map((group) => (
                <div key={group.name}>
                  <h4 className="text-sm font-semibold mb-2">{group.name}</h4>
                  <div className="grid gap-2">
                    {group.controls.map((controlKey) => {
                      const controlNumber = controlKey.replace('control', '');
                      const score = assessment[controlKey as keyof CIS18Assessment] as number | null;
                      const controlName = CIS18ControlNames[controlKey];
                      
                      return (
                        <div key={controlKey} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 min-w-0">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium">CIS-{controlNumber}</span>
                            <p className="text-xs text-muted-foreground truncate" title={controlName}>{controlName}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Progress value={score || 0} className="w-16 h-1.5" />
                            <span className="text-xs font-semibold w-10 text-right">{score || 0}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => organizationSlug && router.push(`/organizations/${organizationSlug}/cis-18/${assessment.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <BarChart3 className="mr-2 h-4 w-4" />
            Comparar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CIS18AssessmentCards({ data, organizationSlug }: CIS18AssessmentCardsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort assessments by date (newest first)
  const sortedData = [...data].sort((a, b) => 
    new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
  );

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {data.length} evaluación{data.length !== 1 ? 'es' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Cuadrícula
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className={viewMode === 'grid' 
        ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
        : 'space-y-4'
      }>
        {sortedData.map((assessment, index) => (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            previousAssessment={sortedData[index + 1]}
            organizationSlug={organizationSlug}
          />
        ))}
      </div>
    </div>
  );
}