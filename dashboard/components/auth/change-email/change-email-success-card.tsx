import * as React from 'react';
import Link from 'next/link';

import { routes } from '@workspace/routes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';

import { useTranslations } from '~/hooks/use-translations';

export type ChangeEmailSuccessCardProps = CardProps & {
  email: string;
};

export function ChangeEmailSuccessCard({
  email,
  className,
  ...other
}: ChangeEmailSuccessCardProps): React.JSX.Element {
  const { t, locale } = useTranslations('auth');

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
          {t('changeEmail.success.title') || 'Email changed'}
        </CardTitle>
        <CardDescription>
          {t('changeEmail.success.description') || 'Your email has been successfully changed to'}{' '}
          <strong className="text-foreground font-medium">{email}</strong>
          {t('changeEmail.success.loggedOut') ||
            (locale === 'es'
              ? '. Como resultado, has sido desconectado y debes iniciar sesión nuevamente.'
              : '. As a result, you\'ve been logged out and must log back in.')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground">
          <Link
            href={routes.dashboard.auth.SignIn}
            className="text-foreground underline"
          >
            {t('changeEmail.success.goToLogin') || (locale === 'es' ? 'Ir a iniciar sesión' : 'Go to log in')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
