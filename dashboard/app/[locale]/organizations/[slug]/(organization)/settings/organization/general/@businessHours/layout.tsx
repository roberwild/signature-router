'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function BusinessHoursLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('organization');

  return (
    <AnnotatedSection
      title={t('general.businessHours.title')}
      description={t('general.businessHours.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
