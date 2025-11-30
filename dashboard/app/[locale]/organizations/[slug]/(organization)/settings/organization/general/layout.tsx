import * as React from 'react';
import { type Metadata } from 'next';

import { createTitle } from '~/lib/formatters';
import { OrganizationSettingsWrapper } from '../wrapper';
import { GeneralContentClient } from './general-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('General')
};

export type OrganizationGeneralLayoutProps = {
  organizationLogo: React.ReactNode;
  organizationSlug: React.ReactNode;
  organizationDetails: React.ReactNode;
  businessHours: React.ReactNode;
  socialMedia: React.ReactNode;
  dangerZone: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function OrganizationGeneralLayout({
  organizationLogo,
  organizationSlug,
  organizationDetails,
  businessHours,
  socialMedia,
  dangerZone,
  params
}: OrganizationGeneralLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  return (
    <OrganizationSettingsWrapper locale={locale}>
      <GeneralContentClient
        organizationLogo={organizationLogo}
        organizationSlug={organizationSlug}
        organizationDetails={organizationDetails}
        businessHours={businessHours}
        socialMedia={socialMedia}
        dangerZone={dangerZone}
      />
    </OrganizationSettingsWrapper>
  );
}
