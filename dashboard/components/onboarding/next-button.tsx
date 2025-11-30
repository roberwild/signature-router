import * as React from 'react';

import { Button, type ButtonProps } from '@workspace/ui/components/button';
import { useTranslations } from '~/hooks/use-translations';

export type NextButtonProps = ButtonProps & {
  isLastStep: boolean;
};

export function NextButton({
  isLastStep,
  ...rest
}: NextButtonProps): React.JSX.Element {
  const { t } = useTranslations('onboarding');

  return (
    <div>
      <Button
        type="button"
        variant="default"
        className="mt-4"
        {...rest}
      >
        {isLastStep ? t('navigation.finish') : `${t('navigation.next')} →`}
      </Button>
    </div>
  );
}
