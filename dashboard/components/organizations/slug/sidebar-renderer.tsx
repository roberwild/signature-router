'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';


import { AppSidebar } from '~/components/organizations/slug/app-sidebar';
import { SettingsSidebar } from '~/components/organizations/slug/settings/settings-sidebar';
import { useActiveOrganization } from '~/hooks/use-active-organization';
import type { FavoriteDto } from '~/types/dtos/favorite-dto';
import type { OrganizationDto } from '~/types/dtos/organization-dto';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type SidebarRendererProps = {
  organizations: OrganizationDto[];
  favorites: FavoriteDto[];
  profile: ProfileDto;
  isAdmin?: boolean;
};

export function SidebarRenderer(
  props: SidebarRendererProps
): React.JSX.Element {
  const pathname = usePathname();
  const activeOrganization = useActiveOrganization();

  // Check if we're on a settings page - pathname includes locale prefix
  // e.g., /es/organizations/testcompany/settings/account/security
  if (pathname.includes(`/organizations/${activeOrganization.slug}/settings`)) {
    return <SettingsSidebar />;
  }

  return <AppSidebar {...props} />;
}
