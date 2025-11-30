import * as React from 'react';
import { type Metadata } from 'next';
import Link from 'next/link';
import {
  FileWarning
} from 'lucide-react';

import {  buttonVariants } from '@workspace/ui/components/button';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';

import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { createTitle } from '~/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Panel de Ciberseguridad')
};

export type CybersecurityLayoutProps = {
  complianceStatus: React.ReactNode;
  incidentStats: React.ReactNode;
  assessmentScore: React.ReactNode;
  recentActivity: React.ReactNode;
  alerts: React.ReactNode;
  quickActions: React.ReactNode;
};

export default function CybersecurityLayout({
  complianceStatus,
  incidentStats,
  assessmentScore,
  recentActivity,
  alerts,
  quickActions
}: CybersecurityLayoutProps): React.JSX.Element {
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            title="Panel de Ciberseguridad"
            info="Centro de control para cumplimiento RGPD y gestión de seguridad"
          />
          <PageActions>
            <Link
              href="/organizations/[slug]/incidents/new"
              className={buttonVariants({ variant: 'default' })}
            >
              <FileWarning className="mr-2 h-4 w-4" />
              Registrar Incidente
            </Link>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Alerts Section - Top Priority */}
          {alerts}
          
          {/* Main Dashboard Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Status and Score */}
            <div className="space-y-6">
              {complianceStatus}
              {assessmentScore}
            </div>
            
            {/* Center Column - Incidents */}
            <div className="lg:col-span-1">
              {incidentStats}
            </div>
            
            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              {quickActions}
            </div>
          </div>
          
          {/* Activity Timeline - Full Width */}
          {recentActivity}
        </div>
      </PageBody>
    </Page>
  );
}