import * as React from 'react';
import type { Metadata } from 'next';

import { getTransactionalEmails } from '~/data/account/get-transactional-emails';
import { getMarketingEmailSettings } from '~/data/account/get-marketing-email-settings';
import { createTitle } from '~/lib/formatters';
import type { Locale } from '@/lib/i18n';
import { AccountSettingsWrapper } from '../wrapper';
import { NotificationsContentClient } from './notifications-content-client';

export const metadata: Metadata = {
  title: createTitle('Notifications')
};

type NotificationsPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function NotificationsPage({ params }: NotificationsPageProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  const [transactionalSettings, marketingSettings] = await Promise.all([
    getTransactionalEmails(),
    getMarketingEmailSettings()
  ]);

  return (
    <AccountSettingsWrapper locale={locale}>
      <NotificationsContentClient
        transactionalSettings={transactionalSettings}
        marketingSettings={marketingSettings}
      />
    </AccountSettingsWrapper>
  );
}