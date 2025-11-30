'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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

const chartConfig = {
  total: {
    label: 'Puntuación Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface EvolutionTranslations {
  chart?: {
    temporalEvolution?: string;
    temporalEvolutionDescription?: string;
  };
  messages?: {
    noAssessments?: string;
  };
}

interface EvolutionChartProps {
  data: Array<{
    id: string;
    scorePersonas: number | null;
    scoreProcesos: number | null;
    scoreSistemas: number | null;
    scoreTotal: number | null;
    createdAt: Date;
  }>;
  translations?: EvolutionTranslations;
  locale?: string;
}

export function EvolutionChart({ data, translations, locale = 'es' }: EvolutionChartProps) {
  // Transform data for chart
  const chartData = data
    .slice()
    .reverse() // Show chronological order (oldest to newest)
    .map((evaluation, index) => ({
      month: evaluation.createdAt.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      total: evaluation.scoreTotal || 0,
      evaluationNumber: index + 1,
      fullDate: evaluation.createdAt.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US'),
    }));

  // Calculate trend
  const hasData = chartData.length > 1;
  const latestScore = chartData[chartData.length - 1]?.total || 0;
  const previousScore = chartData[chartData.length - 2]?.total || 0;
  const trend = hasData ? latestScore - previousScore : 0;
  const trendPercentage = previousScore > 0 ? ((trend / previousScore) * 100).toFixed(1) : '0';

  // Date range for footer
  const dateRange = chartData.length > 0 
    ? `${chartData[0]?.fullDate} - ${chartData[chartData.length - 1]?.fullDate}`
    : 'Sin evaluaciones';

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{translations?.chart?.temporalEvolution || 'Evolución Temporal'}</CardTitle>
          <CardDescription>
            {translations?.chart?.temporalEvolutionDescription || 'Progreso de tu puntuación de ciberseguridad a lo largo del tiempo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <p>{translations?.messages?.noAssessments || 'No hay evaluaciones realizadas todavía'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>{translations?.chart?.temporalEvolution || 'Evolución Temporal'}</CardTitle>
        <CardDescription>
          {translations?.chart?.temporalEvolutionDescription || 'Progreso de tu puntuación de ciberseguridad a lo largo del tiempo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[400px] p-3 sm:p-0">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Area
                  dataKey="total"
                  type="monotone"
                  fill="var(--color-total)"
                  fillOpacity={0.2}
                  stroke="var(--color-total)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {hasData && trend > 0 && (
                <>
                  {locale === 'es' ? `Mejora del ${trendPercentage}% desde la última evaluación` : `${trendPercentage}% improvement since last assessment`} <TrendingUp className="h-4 w-4" />
                </>
              )}
              {hasData && trend < 0 && (
                <>
                  {locale === 'es' ? `Disminución del ${Math.abs(parseFloat(trendPercentage))}% desde la última evaluación` : `${Math.abs(parseFloat(trendPercentage))}% decrease since last assessment`} <TrendingDown className="h-4 w-4" />
                </>
              )}
              {hasData && trend === 0 && (
                <>{locale === 'es' ? 'Sin cambios desde la última evaluación' : 'No change since last assessment'}</>
              )}
              {!hasData && <>Primera evaluación registrada</>}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {dateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}