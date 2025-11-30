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

export type BillingContentClientProps = {
  subscriptionPlan: React.ReactNode;
  billingBreakdown: React.ReactNode;
  billingEmail: React.ReactNode;
  billingAddress: React.ReactNode;
  invoices: React.ReactNode;
};

export function BillingContentClient({
  subscriptionPlan,
  billingBreakdown,
  billingEmail,
  billingAddress,
  invoices
}: BillingContentClientProps): React.JSX.Element {
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
            title={t('billing.title')}
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <SettingsContentWrapper>
          <div className="space-y-8">
            {subscriptionPlan}
            <Separator />
            {billingBreakdown}
            <Separator />
            {billingEmail}
            <Separator />
            {billingAddress}
            <Separator />
            {invoices}
          </div>
        </SettingsContentWrapper>
      </PageBody>
    </Page>
  );
}