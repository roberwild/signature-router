import * as React from 'react';
import { type Metadata } from 'next';

import { createTitle } from '~/lib/formatters';
import { ProfileWrapper } from './wrapper';
import { ProfileContentClient } from './profile-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Profile')
};

export type ProfileLayoutProps = {
  personalDetails: React.ReactNode;
  preferences: React.ReactNode;
  dangerZone: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProfileLayout({
  personalDetails,
  preferences,
  dangerZone,
  params
}: ProfileLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  return (
    <ProfileWrapper locale={locale}>
      <ProfileContentClient
        personalDetails={personalDetails}
        preferences={preferences}
        dangerZone={dangerZone}
      />
    </ProfileWrapper>
  );
}
