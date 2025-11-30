import * as React from 'react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';

import { useTranslations } from '~/hooks/use-translations';

export function ChangeEmailInvalidCard({
  className,
  ...other
}: CardProps): React.JSX.Element {
  const { t } = useTranslations('auth');

  return (
    <Card
      className={cn(
        'w-full px-4 py-2 border-transparent dark:border-border',
        className
      )}
      {...other}
    >
      <CardHeader>
        <CardTitle className="text-base lg:text-lg">
          {t('changeEmail.invalid.title') || 'Change request is invalid'}
        </CardTitle>
        <CardDescription>
          {t('changeEmail.invalid.description') ||
            'Sorry, but your email change request is not valid! This can occur if you submit several change requests, each of which invalidates the prior ones, or if you have already changed your email.'
          }
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
