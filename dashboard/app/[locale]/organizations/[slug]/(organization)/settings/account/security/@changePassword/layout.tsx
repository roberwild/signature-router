'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function ChangePasswordLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('security.changePassword.title')}
      description={t('security.changePassword.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
