'use client';

import * as React from 'react';

import { AnnotatedSection } from '@workspace/ui/components/annotated';
import { useTranslations } from '~/hooks/use-translations';

import { PasswordLoginHint } from '~/components/organizations/slug/settings/account/security/password-login-hint';

export default function ConnectedAccountsLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  const { t } = useTranslations('account');

  return (
    <>
      <AnnotatedSection
        title={t('security.connectedAccounts.title')}
        description={t('security.connectedAccounts.description')}
      >
        {children}
      </AnnotatedSection>
      <PasswordLoginHint />
    </>
  );
}
