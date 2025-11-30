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

export type ProfileContentClientProps = {
  personalDetails: React.ReactNode;
  preferences: React.ReactNode;
  dangerZone: React.ReactNode;
};

export function ProfileContentClient({
  personalDetails,
  preferences,
  dangerZone
}: ProfileContentClientProps): React.JSX.Element {
  const { t } = useTranslations('account');
  const { t: navT } = useTranslations('navigation');

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            index={{
              route: routes.dashboard.organizations.slug.settings.account.Index,
              title: navT('breadcrumbs.account')
            }}
            title={t('profile.title')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            {personalDetails}
            <Separator />
            {preferences}
            <Separator />
            {dangerZone}
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}