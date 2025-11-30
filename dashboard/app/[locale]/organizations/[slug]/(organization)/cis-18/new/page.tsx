import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {  buttonVariants } from '@workspace/ui/components/button';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import Link from 'next/link';

import { ManualEntryForm } from '~/src/features/cis18/components/manual-entry-form';

export const metadata: Metadata = {
  title: 'Nueva Evaluación CIS-18 | Entrada Manual',
  description: 'Ingreso manual de resultados de auditoría CIS-18',
};

interface NewCIS18PageProps {
  params: {
    slug: string;
  };
}

export default async function NewCIS18Page({ params }: NewCIS18PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();
  const organizationId = ctx.organization.id;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Link
              href={`/organizations/${slug}/cis-18`}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Shield className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Nueva Evaluación CIS-18"
              info="Ingreso manual de resultados"
            />
          </div>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-4xl p-6">
          <ManualEntryForm 
            organizationId={organizationId} 
            userId={session.user.id!}
            slug={slug}
          />
        </div>
      </PageBody>
    </Page>
  );
}