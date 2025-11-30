'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import { toast } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

import { resendEmailConfirmation } from '~/actions/auth/resend-email-confirmation';
import { useTranslations } from '~/hooks/use-translations';

export type VerifyEmailExpiredCardProps = CardProps & {
  email: string;
};

export function VerifyEmailExpiredCard({
  email,
  className,
  ...other
}: VerifyEmailExpiredCardProps): React.JSX.Element {
  const params = useParams();
  const _locale = params?.locale as string || 'es';
  const { t } = useTranslations('auth');

  const [isResendingEmailVerification, setIsResendingEmailVerification] =
    React.useState<boolean>(false);
  const handleResendEmailVerification = async (): Promise<void> => {
    setIsResendingEmailVerification(true);
    const result = await resendEmailConfirmation({ email });
    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t('verifyEmail.expired.resendSuccess') || 'Email verification resent');
    } else {
      toast.error(t('verifyEmail.expired.resendError') || "Couldn't resend verification");
    }
    setIsResendingEmailVerification(false);
  };
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
          {t('verifyEmail.expired.title') || 'Email verification is expired'}
        </CardTitle>
        <CardDescription>
          {t('verifyEmail.expired.description') || 'Sorry, your email verification is already expired! You need to request a verification again.'}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center gap-1 text-sm text-muted-foreground">
        {t('verifyEmail.expired.didntReceive') || "Didn't receive an email?"}
        <Button
          type="button"
          variant="link"
          className="h-fit px-0.5 py-0 text-foreground underline"
          disabled={isResendingEmailVerification}
          onClick={handleResendEmailVerification}
        >
          {t('verifyEmail.expired.resend') || 'Resend'}
        </Button>
      </CardFooter>
    </Card>
  );
}
