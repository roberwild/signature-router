# Admin Sidebar Boilerplate Code

Based on the existing organization sidebar structure, here's the boilerplate for the admin panel sidebar.

## Admin Sidebar Component

```tsx
// app/admin/components/admin-sidebar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { BarChart3, LogOut } from 'lucide-react';

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
  SidebarMenuButton
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
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type AdminSidebarProps = {
  profile: ProfileDto;
};

export function AdminSidebar({ profile }: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string || 'es';
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 flex-row items-center py-0">
        <AdminHeader />
      </SidebarHeader>
      
      <SidebarContent className="overflow-hidden">
        <ScrollArea
          verticalScrollBar
          className="h-full [&>[data-radix-scroll-area-viewport]>div]:!flex [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
        >
          <AdminNavMain pathname={pathname} locale={locale} />
          
          {/* Quick Actions - Similar to Report Incident button */}
          <div className="mt-auto px-2 pb-2">
            <Link href="/admin/services/new">
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold shadow-md transition-all duration-200 hover:shadow-lg"
                size="sm"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">View Analytics</span>
              </Button>
            </Link>
          </div>
          
          <AdminNavSupport />
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter className="h-14">
        <AdminNavUser profile={profile} />
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}

// Admin Header Component
function AdminHeader() {
  return (
    <div className="flex w-full items-center gap-2 px-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Admin Panel</span>
          <span className="text-xs text-muted-foreground">Minery Guard</span>
        </div>
      </div>
    </div>
  );
}

// Admin Navigation Items
function AdminNavMain({ pathname, locale }: { pathname: string; locale: string }) {
  const navItems = createAdminNavItems(locale);
  
  return (
    <SidebarGroup>
      <SidebarMenu>
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
              >
                <Link href={item.href}>
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
  );
}

// Admin Support Section
function AdminNavSupport() {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/admin/help">
              <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
              <span className="dark:text-muted-foreground">Help & Support</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

// Admin User Menu
function AdminNavUser({ profile }: { profile: ProfileDto }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-12 w-full justify-start px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.image} alt={profile.name} />
            <AvatarFallback>{profile.name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-2 flex flex-col items-start truncate">
            <span className="text-sm font-medium">{profile.name}</span>
            <span className="text-xs text-muted-foreground">Platform Admin</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations">
            <Building2 className="mr-2 h-4 w-4" />
            Back to Organizations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Admin Navigation Items

```tsx
// app/admin/components/admin-nav-items.tsx
import {
  BarChart3,
  Users,
  MessageSquare,
  Building2,
  TrendingUp,
  Settings,
  FileText,
  DollarSign
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon: LucideIcon;
};

export function createAdminNavItems(locale?: string): NavItem[] {
  const localePrefix = locale ? `/${locale}` : '';
  
  return [
    {
      title: 'Dashboard',
      href: `${localePrefix}/admin`,
      icon: BarChart3
    },
    {
      title: 'Service Requests',
      href: `${localePrefix}/admin/services`,
      icon: FileText
    },
    {
      title: 'Contact Messages',
      href: `${localePrefix}/admin/messages`,
      icon: MessageSquare
    },
    {
      title: 'Organizations',
      href: `${localePrefix}/admin/organizations`,
      icon: Building2
    },
    {
      title: 'Users',
      href: `${localePrefix}/admin/users`,
      icon: Users
    },
    {
      title: 'Analytics',
      href: `${localePrefix}/admin/analytics`,
      icon: TrendingUp
    },
    {
      title: 'Revenue',
      href: `${localePrefix}/admin/revenue`,
      icon: DollarSign
    },
    {
      title: 'Settings',
      href: `${localePrefix}/admin/settings`,
      icon: Settings
    }
  ];
}
```

## Admin Layout with Sidebar

```tsx
// app/admin/layout.tsx
import { requirePlatformAdmin } from '~/middleware/admin';
import { getProfile } from '~/data/account/get-profile';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { AdminSidebar } from './components/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check admin access
  await requirePlatformAdmin();
  
  // Get profile for sidebar
  const profile = await getProfile();
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar profile={profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
```

## Key Patterns Replicated

1. **Structure**: Same component hierarchy as organization sidebar
2. **Collapsible**: Icon-based collapse like organization sidebar
3. **Active States**: Same isActive pattern with pathname checking
4. **Styling**: Same Tailwind classes and color patterns
5. **User Menu**: Dropdown menu in footer like organization sidebar
6. **Scroll Area**: Same scroll configuration
7. **Rail**: Sidebar rail for resize handle

## Differences from Organization Sidebar

1. **No Organization Switcher**: Replaced with "Admin Panel" header
2. **Different Nav Items**: Admin-specific routes
3. **No Favorites**: Not needed for admin
4. **Simpler Context**: No organization context needed
5. **Admin Badge**: Shows "Platform Admin" under user name

## Usage

1. Create the admin sidebar component
2. Use it in the admin layout
3. All admin pages will automatically have the sidebar
4. Navigation items highlight based on current route
5. Consistent with existing platform design

This boilerplate ensures the admin panel sidebar looks and feels exactly like the organization sidebar, maintaining complete UI consistency.