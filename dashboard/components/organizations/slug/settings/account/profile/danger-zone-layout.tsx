'use client';

import * as React from 'react';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export function DangerZoneLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('profile.dangerZone.title')}
      description={t('profile.dangerZone.description')}
    >
      {children}
    </AnnotatedSection>
  );
}