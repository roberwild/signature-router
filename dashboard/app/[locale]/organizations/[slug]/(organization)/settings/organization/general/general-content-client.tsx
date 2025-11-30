'use client';

import * as React from 'react';

import { routes } from '@workspace/routes';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar
} from '@workspace/ui/components/page';
import { Separator } from '@workspace/ui/components/separator';

import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { SettingsContentWrapper } from '~/components/organizations/slug/settings/settings-content-wrapper';
import { useTranslations } from '~/hooks/use-translations';

export type GeneralContentClientProps = {
  organizationLogo: React.ReactNode;
  organizationSlug: React.ReactNode;
  organizationDetails: React.ReactNode;
  businessHours: React.ReactNode;
  socialMedia: React.ReactNode;
  dangerZone: React.ReactNode;
};

export function GeneralContentClient({
  organizationLogo,
  organizationSlug,
  organizationDetails,
  businessHours,
  socialMedia,
  dangerZone
}: GeneralContentClientProps): React.JSX.Element {
  const { t } = useTranslations('organization');
  const { t: navT } = useTranslations('navigation');

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            index={{
              route:
                routes.dashboard.organizations.slug.settings.organization.Index,
              title: navT('breadcrumbs.organization')
            }}
            title={t('general.title')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            {organizationLogo}
            <Separator />
            {organizationSlug}
            <Separator />
            {organizationDetails}
            <Separator />
            {businessHours}
            <Separator />
            {socialMedia}
            <Separator />
            {dangerZone}
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}