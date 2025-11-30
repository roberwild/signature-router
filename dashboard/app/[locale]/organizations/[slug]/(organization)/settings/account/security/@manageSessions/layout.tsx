'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function ManageSessionsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('security.sessions.title')}
      description={t('security.sessions.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
