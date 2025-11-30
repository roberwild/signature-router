import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Briefcase } from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Button } from '@workspace/ui/components/button';
import { ServicesPageContent } from '~/components/services/services-page-content';
import Link from 'next/link';


interface ServicesPageProps {
  params: {
    slug: string;
  };
}

export const metadata: Metadata = {
  title: 'Servicios Adicionales | Minery',
  description: 'Descubre servicios especializados de ciberseguridad para fortalecer tu organización',
};

export default async function ServicesPage({ params }: ServicesPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const ctx = await getAuthOrganizationContext();

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Briefcase className="h-6 w-6 text-primary flex-shrink-0" />
            <OrganizationPageTitle
              title="Servicios Adicionales"
              info="Servicios especializados de ciberseguridad para fortalecer tu organización"
            />
          </div>
          <PageActions className="flex-shrink-0">
            <Link href={`/organizations/${slug}/services/requests`}>
              <Button variant="outline">
                Mis Solicitudes
              </Button>
            </Link>
            <Button variant="outline" asChild>
              <a href={`/organizations/${slug}/services/contact`}>
                Contactar con Ventas
              </a>
            </Button>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <ServicesPageContent
          organizationId={ctx.organization.id}
          organizationSlug={slug}
          organizationName={ctx.organization.name}
          user={{
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || ''
          }}
        />
      </PageBody>
    </Page>
  );
}