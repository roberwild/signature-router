'use client';

import * as React from 'react';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export function TransactionalEmailsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <AnnotatedSection
      title={t('notifications.emails.transactional.title')}
      description={t('notifications.emails.transactional.description')}
    >
      {children}
    </AnnotatedSection>
  );
}