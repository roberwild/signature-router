'use client';

import * as React from 'react';

import { session } from '@workspace/auth/session';
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

export type SecurityContentClientProps = {
  changePassword: React.ReactNode;
  connectedAccounts: React.ReactNode;
  multiFactorAuthentication: React.ReactNode;
  manageSessions: React.ReactNode;
};

export function SecurityContentClient({
  changePassword,
  connectedAccounts,
  multiFactorAuthentication,
  manageSessions
}: SecurityContentClientProps): React.JSX.Element {
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
            title={t('navigation.security')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            {changePassword}
            <Separator />
            {connectedAccounts}
            <Separator />
            {multiFactorAuthentication}
            {session.strategy === 'database' && (
              <>
                <Separator />
                {manageSessions}
              </>
            )}
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}