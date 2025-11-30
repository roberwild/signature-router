/**
 * Admin Sidebar Component
 * Main navigation sidebar for the admin panel
 * Styled with Singular Bank design
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { LogOut, Building2, BarChart3 } from 'lucide-react';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@workspace/ui/components/sidebar';
import { Button } from '@workspace/ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

import { cn } from '@workspace/ui/lib/utils';
import { signOut } from '~/actions/auth/sign-out';
import { createAdminNavItems } from './admin-nav-items';

export type AdminSidebarProps = {
  profile: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export function AdminSidebar({ profile }: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white">
      <SidebarHeader className="flex h-14 flex-row items-center py-0 border-b border-border">
        <AdminHeader />
      </SidebarHeader>

      <SidebarContent className="overflow-hidden bg-white">
        <ScrollArea
          verticalScrollBar
          className="h-full [&>[data-radix-scroll-area-viewport]>div]:!flex [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <AdminNavMain pathname={pathname} locale={locale} />

          {/* Quick Action Button */}
          <div className="mt-auto px-2 pb-2">
            <Link href={`/${locale}/admin/analytics`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm transition-all duration-200" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Ver Analytics
                </span>
              </Button>
            </Link>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="h-14 border-t border-border">
        <AdminNavUser profile={profile} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function AdminHeader() {
  return (
    <div className="flex w-full items-center gap-3 px-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <span className="text-base font-bold text-white">M</span>
      </div>
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-semibold text-foreground">
          Admin Panel
        </span>
        <span className="text-xs text-muted-foreground">Minery Guard</span>
      </div>
    </div>
  );
}

function AdminNavMain({
  pathname,
  locale,
}: {
  pathname: string;
  locale: string;
}) {
  const navItems = createAdminNavItems(locale);

  return (
    <SidebarGroup className="mt-4">
      <SidebarMenu>
        {navItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
                className={cn(
                  'mx-2 rounded-lg transition-colors',
                  isActive && 'bg-singular-gray text-primary font-medium'
                )}
              >
                <Link href={item.href}>
                  <item.icon
                    className={cn(
                      'size-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className={isActive ? 'text-primary' : 'text-foreground'}>
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AdminNavUser({
  profile,
}: {
  profile: { name: string; email: string; image?: string | null };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start px-3 hover:bg-singular-gray transition-colors"
        >
          <Avatar className="h-8 w-8 ring-2 ring-singular-gray">
            <AvatarImage src={profile.image || undefined} alt={profile.name} />
            <AvatarFallback className="bg-primary text-white font-semibold">
              {profile.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-foreground">
              {profile.name}
            </span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-semibold">
          Admin Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations" className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4" />
            Volver a Organizaciones
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
          }}
          className="text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
