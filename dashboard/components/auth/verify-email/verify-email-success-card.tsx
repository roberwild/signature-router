'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export function VerifyEmailSuccessCard({
  className,
  ...other
}: CardProps): React.JSX.Element {
  const params = useParams();
  const _locale = params?.locale as string || 'es';
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
        <CardTitle className="text-base lg:text-lg">{t('verifyEmail.success.title') || 'Email verified'}</CardTitle>
        <CardDescription>
          {t('verifyEmail.success.description') || 'Your email has been successfully verified. You can log in with your account now.'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center text-sm">
        <Link
          href={routes.dashboard.auth.SignIn}
          className="text-foreground underline"
        >
          {t('verifyEmail.success.backToLogin') || 'Back to log in'}
        </Link>
      </CardFooter>
    </Card>
  );
}
