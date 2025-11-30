'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function BillingAddressLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('organization');

  return (
    <AnnotatedSection
      title={t('billing.billingAddress.title')}
      description={t('billing.billingAddress.description')}
    >
      {children}
    </AnnotatedSection>
  );
}
