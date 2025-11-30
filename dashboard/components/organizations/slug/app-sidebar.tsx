'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { useTranslations } from '~/hooks/use-translations';

// import { NavFavorites } from '~/components/organizations/slug/nav-favorites';
import { NavMain } from '~/components/organizations/slug/nav-main';
import { NavIncidentActions } from '~/components/organizations/slug/nav-incident-actions';
import { NavSupport } from '~/components/organizations/slug/nav-support';
import { NavUser } from '~/components/organizations/slug/nav-user';
import { OrganizationSwitcher } from '~/components/organizations/slug/organization-switcher';
import { useActiveOrganization } from '~/hooks/use-active-organization';
import type { FavoriteDto } from '~/types/dtos/favorite-dto';
import type { OrganizationDto } from '~/types/dtos/organization-dto';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type AppSidebarProps = {
  organizations: OrganizationDto[];
  favorites: FavoriteDto[];
  profile: ProfileDto;
  isAdmin?: boolean;
};

export function AppSidebar({
  organizations,
  favorites: _favorites,
  profile,
  isAdmin = false
}: AppSidebarProps): React.JSX.Element {
  const activeOrganization = useActiveOrganization();
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslations('navigation');
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center py-0">
        <OrganizationSwitcher organizations={organizations} />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea
          verticalScrollBar
          /* Overriding the hardcoded { disply:table } to get full flex height */
          className="h-full [&>[data-radix-scroll-area-viewport]>div]:!flex [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <NavMain />
          {/* <NavFavorites favorites={favorites} /> */}
          
          {/* Contextual Incident Actions - Shows only when viewing an incident */}
          <NavIncidentActions />
          
          {/* Prominent Report Incident Button - Above Support Section */}
          <div className="mt-auto px-2 pb-2">
            <Link href={`/${locale}/organizations/${activeOrganization.slug}/incidents/new`}>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-md transition-all duration-200 hover:shadow-lg group"
                size="sm"
              >
                <AlertTriangle className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                <span className="group-data-[collapsible=icon]:hidden">{t('main.reportIncident') || 'Report Incident'}</span>
              </Button>
            </Link>
          </div>
          
          <NavSupport
            profile={profile}
            className="pb-0"
            isAdmin={isAdmin}
            locale={locale}
          />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          profile={profile}
          className="p-0"
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
