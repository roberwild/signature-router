'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function MultiFactorAuthenticationLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('security.multiFactorAuth.title')}
      description={t('security.multiFactorAuth.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
