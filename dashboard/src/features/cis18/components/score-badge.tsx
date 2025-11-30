import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>
        -
      </span>
    );
  }

  const getVariant = (value: number): 'default' | 'secondary' | 'destructive' => {
    if (value >= 70) return 'default';  // Green
    if (value >= 40) return 'secondary'; // Yellow
    return 'destructive';                // Red
  };

  const getColorClasses = (value: number): string => {
    if (value >= 70) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (value >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    return 'bg-red-100 text-red-800 hover:bg-red-200';
  };

  return (
    <Badge 
      variant={getVariant(score)}
      className={cn(getColorClasses(score), className)}
    >
      {score.toFixed(0)}%
    </Badge>
  );
}