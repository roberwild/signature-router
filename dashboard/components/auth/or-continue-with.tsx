'use client';

import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

interface OrContinueWithProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function OrContinueWith({
  className,
  text,
  ...other
}: OrContinueWithProps): React.JSX.Element {
  const { t, locale } = useTranslations('auth');

  const defaultText = locale === 'es' ? t('signIn.orContinueWith') : 'Or continue with';

  return (
    <p
      className={cn(
        'flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
        className
      )}
      {...other}
    >
      {text || defaultText}
    </p>
  );
}
