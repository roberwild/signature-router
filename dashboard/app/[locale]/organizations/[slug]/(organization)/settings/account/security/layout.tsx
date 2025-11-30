import * as React from 'react';
import { type Metadata } from 'next';

import { createTitle } from '~/lib/formatters';
import { AccountSettingsWrapper } from '../wrapper';
import { SecurityContentClient } from './security-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Security')
};

export type SecurityLayoutProps = {
  changePassword: React.ReactNode;
  connectedAccounts: React.ReactNode;
  multiFactorAuthentication: React.ReactNode;
  manageSessions: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function SecurityLayout({
  changePassword,
  connectedAccounts,
  multiFactorAuthentication,
  manageSessions,
  params
}: SecurityLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  return (
    <AccountSettingsWrapper locale={locale}>
      <SecurityContentClient
        changePassword={changePassword}
        connectedAccounts={connectedAccounts}
        multiFactorAuthentication={multiFactorAuthentication}
        manageSessions={manageSessions}
      />
    </AccountSettingsWrapper>
  );
}