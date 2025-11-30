'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

import { baseUrl, getPathname } from '@workspace/routes';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  type SidebarGroupProps
} from '@workspace/ui/components/sidebar';
import { cn } from '@workspace/ui/lib/utils';

import { createMainNavSections } from '~/components/organizations/slug/nav-items';
import { useActiveOrganization } from '~/hooks/use-active-organization';
import { useTranslations } from '~/hooks/use-translations';

export function NavMain(props: SidebarGroupProps): React.JSX.Element {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const activeOrganization = useActiveOrganization();
  const { t } = useTranslations('navigation');
  
  const sections = createMainNavSections(activeOrganization.slug, locale, {
    main: {
      home: t('main.home'),
      services: t('main.services'),
      serviceRequests: t('main.serviceRequests'),
      assessments: t('main.assessments'),
      incidents: t('main.incidents'),
      settings: t('main.settings'),
      premiumSection: t('main.premiumSection'),
      mineryServices: t('main.mineryServices'),
      virtualAdvisor: t('main.virtualAdvisor')
    }
  });
  
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          <SidebarGroup {...props}>
            {section.title && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {section.items.map((item, itemIndex) => {
                const isActive = pathname.startsWith(
                  getPathname(item.href, baseUrl.Dashboard)
                );
                return (
                  <SidebarMenuItem key={itemIndex}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.disabled ? '~/' : item.href}
                        target={item.external ? '_blank' : undefined}
                      >
                        <item.icon
                          className={cn(
                            'size-4 shrink-0',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={
                            isActive
                              ? 'dark:text-foreground'
                              : 'dark:text-muted-foreground'
                          }
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
          {sectionIndex < sections.length - 1 && (
            <SidebarSeparator className="my-2" />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
