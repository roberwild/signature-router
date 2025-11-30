'use client';

import * as React from 'react';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export function MarketingEmailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('notifications.emails.marketing.title')}
      description={t('notifications.emails.marketing.description')}
    >
      {children}
    </AnnotatedSection>
  );
}