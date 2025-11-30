import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  highlight,
  className
}: FeatureCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="mb-3 sm:mb-4 flex size-10 sm:size-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="mb-2 text-base sm:text-lg font-semibold break-words">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      {highlight && (
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-primary">{highlight}</p>
      )}
    </div>
  );
}