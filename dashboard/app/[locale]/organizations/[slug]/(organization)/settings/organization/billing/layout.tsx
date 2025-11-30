import * as React from 'react';
import { type Metadata } from 'next';

import { createTitle } from '~/lib/formatters';
import { OrganizationSettingsWrapper } from '../wrapper';
import { BillingContentClient } from './billing-content-client';
import type { Locale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: createTitle('Billing')
};

export type BillingLayoutProps = {
  subscriptionPlan: React.ReactNode;
  billingBreakdown: React.ReactNode;
  billingEmail: React.ReactNode;
  billingAddress: React.ReactNode;
  invoices: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function BillingLayout({
  subscriptionPlan,
  billingBreakdown,
  billingEmail,
  billingAddress,
  invoices,
  params
}: BillingLayoutProps): Promise<React.JSX.Element> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;

  return (
    <OrganizationSettingsWrapper locale={locale}>
      <BillingContentClient
        subscriptionPlan={subscriptionPlan}
        billingBreakdown={billingBreakdown}
        billingEmail={billingEmail}
        billingAddress={billingAddress}
        invoices={invoices}
      />
    </OrganizationSettingsWrapper>
  );
}
