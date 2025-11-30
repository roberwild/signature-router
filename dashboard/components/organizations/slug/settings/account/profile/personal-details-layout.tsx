'use client';

import * as React from 'react';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export function PersonalDetailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('profile.personalDetails.title')}
      description={t('profile.personalDetails.description')}
    >
      {children}
    </AnnotatedSection>
  );
}