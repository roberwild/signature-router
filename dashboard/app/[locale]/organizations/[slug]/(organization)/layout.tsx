import * as React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { SidebarInset } from '@workspace/ui/components/sidebar';

import { SidebarRenderer } from '~/components/organizations/slug/sidebar-renderer';
import { ServicesWidget } from '~/components/organizations/slug/services-widget';
import { getProfile } from '~/data/account/get-profile';
import { getFavorites } from '~/data/favorites/get-favorites';
import { getOrganizations } from '~/data/organization/get-organizations';
import { isPlatformAdmin } from '~/data/user/get-platform-admin-status';
import { createTitle } from '~/lib/formatters';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: createTitle('Organization')
};

export default async function OrganizationLayout(
  props: NextPageProps & React.PropsWithChildren
): Promise<React.JSX.Element> {
  const ctx = await getAuthOrganizationContext();
  const [cookieStore, organizations, favorites, profile, isAdmin] = await Promise.all([
    cookies(),
    getOrganizations(),
    getFavorites(),
    getProfile(),
    isPlatformAdmin()
  ]);
  return (
    <div className="flex h-screen overflow-hidden">
      <Providers
        organization={ctx.organization}
        defaultOpen={
          (cookieStore.get('sidebar:state')?.value ?? 'true') === 'true'
        }
        defaultWidth={cookieStore.get('sidebar:width')?.value}
      >
        <SidebarRenderer
          organizations={organizations}
          favorites={favorites}
          profile={profile}
          isAdmin={isAdmin}
        />
        {/* Set max-width so full-width tables can overflow horizontally correctly */}
        <SidebarInset
          id="skip"
          className="flex-1 overflow-auto lg:[transition:max-width_0.2s_linear] lg:peer-data-[state=collapsed]:max-w-[calc(100svw-var(--sidebar-width-icon))] lg:peer-data-[state=expanded]:max-w-[calc(100svw-var(--sidebar-width))]"
        >
          {props.children}
          <ServicesWidget organizationSlug={ctx.organization.slug} />
        </SidebarInset>
      </Providers>
    </div>
  );
}
