import * as React from 'react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { FileWarning, Shield } from 'lucide-react';

import { buttonVariants } from '@workspace/ui/components/button';
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

export type HomeLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string; locale: string }>;
};

export default async function HomeLayout({
  children,
  params
}: HomeLayoutProps): Promise<React.JSX.Element> {
  const { slug } = await params;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Panel de Ciberseguridad"
              info="Centro de control para cumplimiento RGPD y gestión de seguridad"
            />
          </div>
          <PageActions>
            <Link
              href={`/organizations/${slug}/incidents/new`}
              className={buttonVariants({ variant: 'default' })}
            >
              <FileWarning className="mr-2 h-4 w-4" />
              Reportar Incidente
            </Link>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        {children}
      </PageBody>
    </Page>
  );
}
