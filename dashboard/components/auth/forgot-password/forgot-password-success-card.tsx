'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { InfoIcon } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from '~/hooks/use-translations';

export type ForgotPasswordSuccessCardProps = CardProps & {
  email: string;
};

export function ForgotPasswordSuccessCard({
  email,
  className,
  ...other
}: ForgotPasswordSuccessCardProps): React.JSX.Element {
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
        <CardTitle className="text-base lg:text-lg">
          {t('forgotPassword.success.title') || 'Reset instructions sent'}
        </CardTitle>
        <CardDescription>
          {t('forgotPassword.success.description') || 'An email with a link and reset instructions is on its way to'}{' '}
          <strong className="text-foreground font-medium">{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="info">
          <div className="flex flex-row items-start gap-2">
            <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
            <AlertDescription>
              {t('forgotPassword.success.info') || "If you don't receive an email soon, check that the email address you entered is correct, check your spam folder or reach out to support if the issue persists."}
            </AlertDescription>
          </div>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link
          href={routes.dashboard.auth.SignIn}
          className="text-foreground underline"
        >
          {t('forgotPassword.success.backToLogin') || 'Back to log in'}
        </Link>
      </CardFooter>
    </Card>
  );
}
