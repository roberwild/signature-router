'use client';

import * as React from 'react';
import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from '~/hooks/use-translations';

export function ResetPasswordSuccessCard({
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
          {t('resetPassword.success.title') || 'Password updated'}
        </CardTitle>
        <CardDescription>
          {t('resetPassword.success.description') || 'Your password has been successfully changed. Use your new password to log in.'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center text-sm">
        <Link
          href={routes.dashboard.auth.SignIn}
          className="text-foreground underline"
        >
          {t('resetPassword.success.backToLogin') || 'Back to log in'}
        </Link>
      </CardFooter>
    </Card>
  );
}
