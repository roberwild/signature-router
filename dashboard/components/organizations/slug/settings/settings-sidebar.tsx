'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeftIcon } from 'lucide-react';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail
} from '@workspace/ui/components/sidebar';

import { NavAccount } from '~/components/organizations/slug/settings/nav-account';
import { NavOrganization } from '~/components/organizations/slug/settings/nav-organization';
import { useActiveOrganization } from '~/hooks/use-active-organization';
import { useTranslations } from '~/hooks/use-translations';

export function SettingsSidebar(): React.JSX.Element {
  const activeOrganization = useActiveOrganization();
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslations('navigation');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center py-0">
        <Link
          href={`/${locale}/organizations/${activeOrganization.slug}/home`}
          className="flex w-full items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent"
        >
          <ChevronLeftIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-semibold">{t('sidebar.backToDashboard')}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea
          verticalScrollBar
          className="h-full [&>[data-radix-scroll-area-viewport]>div]:!flex [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <div className="p-3">
            <NavAccount />
            <NavOrganization />
          </div>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
