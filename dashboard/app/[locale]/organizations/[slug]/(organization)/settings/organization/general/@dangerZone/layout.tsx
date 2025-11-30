'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function DangerZoneLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('organization');

  return (
    <AnnotatedSection
      title={t('general.dangerZone.title')}
      description={t('general.dangerZone.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
