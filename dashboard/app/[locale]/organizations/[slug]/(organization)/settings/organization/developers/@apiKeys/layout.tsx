'use client';

import * as React from 'react';

import { baseUrl } from '@workspace/routes';
import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

export default function ApiKeysLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('organization');

  return (
    <AnnotatedSection
      title={t('developers.apiKeys.title')}
      description={t('developers.apiKeys.description')}
      docLink={baseUrl.PublicApi}
    >
      {children}
    </AnnotatedSection>
  );
}
