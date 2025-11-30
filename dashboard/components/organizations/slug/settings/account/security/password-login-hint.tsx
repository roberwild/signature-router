'use client';

import * as React from 'react';
import { InfoIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { cn } from '@workspace/ui/lib/utils';

import { useTranslations } from '~/hooks/use-translations';

export function PasswordLoginHint({
  className,
  ...other
}: React.HtmlHTMLAttributes<HTMLDivElement>): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <div
      className={cn('max-w-4xl px-6', className)}
      {...other}
    >
      <Alert variant="default">
        <div className="flex flex-row items-start gap-2">
          <InfoIcon className="mt-0.5 size-[18px] shrink-0" />
          <AlertDescription>
            {t('security.connectedAccounts.passwordHint')}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
