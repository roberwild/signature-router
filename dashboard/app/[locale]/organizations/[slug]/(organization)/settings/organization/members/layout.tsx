import * as React from 'react';
import { type Metadata } from 'next';

import { createTitle } from '~/lib/formatters';
import { OrganizationSettingsWrapper } from '../wrapper';
import { MembersContentClient } from './members-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Members')
};

export type MembersLayoutProps = {
  team: React.ReactNode;
  invitations: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MembersLayout({
  team,
  invitations,
  params
}: MembersLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  return (
    <OrganizationSettingsWrapper locale={locale}>
      <MembersContentClient
        team={team}
        invitations={invitations}
      />
    </OrganizationSettingsWrapper>
  );
}
