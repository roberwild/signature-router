'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart';

interface ScoreComparisonChartProps {
  value: number;
  average: number;
  previousValue?: number;
}

const chartConfig = {
  score: {
    label: 'Tu puntuación',
    color: 'hsl(var(--primary))',
  },
  average: {
    label: 'Media global',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export function ScoreComparisonChart({ value, average, previousValue }: ScoreComparisonChartProps) {
  // Ensure values are within 0-100 range
  const userScore = Math.max(0, Math.min(100, value));
  const globalAvg = Math.max(0, Math.min(100, average));
  
  // Calculate trend
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercentage = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : null;
  
  // Prepare data for the radial chart
  // Order matters: items are drawn from outside to inside
  const chartData = [
    { 
      name: 'average',
      value: globalAvg,
      fill: 'hsl(var(--muted-foreground))',
    },
    { 
      name: 'score',
      value: userScore,
      fill: 'hsl(var(--primary))',
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Comparación Global</CardTitle>
        <CardDescription>Tu posición respecto a la media del sector</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart 
            data={chartData} 
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={110}
            barCategoryGap={8}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                hideLabel 
                nameKey="name"
                formatter={(value, name) => {
                  const label = name === 'score' ? 'Tu puntuación' : 'Media global';
                  return `${label}: ${value}%`;
                }}
              />}
            />
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar 
              dataKey="value" 
              background={{ fill: 'hsl(var(--muted))' }}
              cornerRadius={10}
              className="stroke-transparent"
            />
            {/* Score display in center */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan
                x="50%"
                dy="-0.5em"
                className="text-3xl font-bold"
              >
                {userScore}%
              </tspan>
              <tspan
                x="50%"
                dy="1.5em"
                className="text-sm fill-muted-foreground"
              >
                Tu puntuación
              </tspan>
            </text>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      
      <CardFooter className="flex-col gap-3 text-sm">
        {/* Trend indicator */}
        {trendPercentage && (
          <div className="flex items-center gap-2 font-medium">
            {trend > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                Mejora del {trendPercentage}% desde la última evaluación
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                Disminución del {Math.abs(Number(trendPercentage))}% desde la última evaluación
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 text-muted-foreground" />
                Sin cambios desde la última evaluación
              </>
            )}
          </div>
        )}
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span className="font-medium">{userScore}%</span>
            <span className="text-muted-foreground">Tu puntuación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
            <span className="font-medium">{globalAvg}%</span>
            <span className="text-muted-foreground">Media global</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}