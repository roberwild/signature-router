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
import { TransactionalEmailsCard } from '~/components/organizations/slug/settings/account/notifications/transactional-emails-card';
import { MarketingEmailsCard } from '~/components/organizations/slug/settings/account/notifications/marketing-emails-card';
import { TransactionalEmailsLayout } from '~/components/organizations/slug/settings/account/notifications/transactional-emails-layout';
import { MarketingEmailsLayout } from '~/components/organizations/slug/settings/account/notifications/marketing-emails-layout';
import { useTranslations } from '~/hooks/use-translations';
import type { TransactionalEmailsDto } from '~/types/dtos/transactional-emails-dto';
import type { MarketingEmailsDto } from '~/types/dtos/marketing-emails-dto';

export type NotificationsContentClientProps = {
  transactionalSettings: TransactionalEmailsDto;
  marketingSettings: MarketingEmailsDto;
};

export function NotificationsContentClient({
  transactionalSettings,
  marketingSettings
}: NotificationsContentClientProps): React.JSX.Element {
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
            title={t('navigation.notifications')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            <TransactionalEmailsLayout>
              <TransactionalEmailsCard settings={transactionalSettings} />
            </TransactionalEmailsLayout>
            <Separator />
            <MarketingEmailsLayout>
              <MarketingEmailsCard settings={marketingSettings} />
            </MarketingEmailsLayout>
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}