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

export type DevelopersContentClientProps = {
  apiKeys: React.ReactNode;
  webhooks: React.ReactNode;
};

export function DevelopersContentClient({
  apiKeys,
  webhooks
}: DevelopersContentClientProps): React.JSX.Element {
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
            title={t('developers.title')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            {apiKeys}
            <Separator />
            {webhooks}
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}