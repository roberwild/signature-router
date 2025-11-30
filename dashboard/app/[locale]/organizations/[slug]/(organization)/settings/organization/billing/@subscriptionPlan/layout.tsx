'use client';

import * as React from 'react';

import { APP_NAME } from '@workspace/common/app';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function SubscriptionPlanLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('organization');

  return (
    <AnnotatedSection
      title={t('billing.subscriptionPlan.title')}
      description={t('billing.subscriptionPlan.description', { appName: APP_NAME })}
    >
      {children}
    </AnnotatedSection>
  );
}
