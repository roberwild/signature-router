import * as React from 'react';
import { type Metadata } from 'next';


import { createTitle } from '~/lib/formatters';
import { OrganizationSettingsWrapper } from '../wrapper';
import { DevelopersContentClient } from './developers-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Developers')
};

export type DevelopersLayoutProps = {
  apiKeys: React.ReactNode;
  webhooks: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DevelopersLayout({
  apiKeys,
  webhooks,
  params
}: DevelopersLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  return (
    <OrganizationSettingsWrapper locale={locale}>
      <DevelopersContentClient
        apiKeys={apiKeys}
        webhooks={webhooks}
      />
    </OrganizationSettingsWrapper>
  );
}
