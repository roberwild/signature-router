'use client';

import * as React from 'react';
import { CircleCheck, XCircleIcon } from 'lucide-react';

import { MINIMUM_PASSWORD_LENGTH } from '@workspace/auth/constants';
import { passwordValidator } from '@workspace/auth/password';
import type { Maybe } from '@workspace/common/maybe';
import { useFormField } from '@workspace/ui/components/form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

export type PasswordFormMessageProps = {
  password: Maybe<string>;
};

export function PasswordFormMessage({
  password
}: PasswordFormMessageProps): React.JSX.Element {
  const { t, locale } = useTranslations('auth');
  const { error, formMessageId } = useFormField();

  const containsLowerAndUpperCase =
    passwordValidator.containsLowerAndUpperCase(password);
  const hasMinimumLength = passwordValidator.hasMinimumLength(password);
  const containsNumber = passwordValidator.containsNumber(password);
  const isPasswordValid =
    containsLowerAndUpperCase && hasMinimumLength && containsNumber;

  const getRequirementToShow = () => {
    if (isPasswordValid) {
      return {
        met: true,
        text: locale === 'es' ? 'Todos los requisitos cumplidos' : 'All requirements met'
      };
    }
    if (!hasMinimumLength) {
      return {
        met: false,
        text: t('passwordRequirements.minLength') || `${MINIMUM_PASSWORD_LENGTH} or more characters`
      };
    }
    if (!containsLowerAndUpperCase) {
      return {
        met: false,
        text: t('passwordRequirements.upperAndLowercase') || 'Uppercase and lowercase letters'
      };
    }
    return {
      met: false,
      text: t('passwordRequirements.number') || 'At least one number'
    };
  };

  const requirement = getRequirementToShow();

  return (
    <div
      id={formMessageId}
      className={cn(
        'flex items-center gap-1.5 px-1 text-[0.8rem] font-medium',
        requirement.met
          ? 'text-green-500'
          : error
            ? 'text-destructive'
            : 'text-muted-foreground'
      )}
    >
      {requirement.met ? (
        <CircleCheck className="h-3.5 w-3.5" />
      ) : (
        <XCircleIcon className="h-3.5 w-3.5" />
      )}
      <p>{requirement.text}</p>
    </div>
  );
}
