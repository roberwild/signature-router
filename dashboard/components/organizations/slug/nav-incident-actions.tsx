'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Edit, 
  History, 
  ChevronLeft,
  Shield
} from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@workspace/ui/components/sidebar';
import { Separator } from '@workspace/ui/components/separator';

import { useActiveOrganization } from '~/hooks/use-active-organization';

export function NavIncidentActions(
  props: SidebarGroupProps
): React.JSX.Element | null {
  const pathname = usePathname();
  const activeOrganization = useActiveOrganization();
  
  // Only show this nav group when viewing an incident detail, edit, or history page
  const incidentMatch = pathname.match(/\/incidents\/([^/]+)/);
  const currentIncidentId = incidentMatch?.[1];
  
  if (!currentIncidentId || pathname.includes('/incidents/new')) {
    return null;
  }

  const isDetailPage = pathname.endsWith(currentIncidentId);
  const isEditPage = pathname.includes(`${currentIncidentId}/edit`);
  const isHistoryPage = pathname.includes(`${currentIncidentId}/history`);

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Shield className="h-3 w-3" />
          Acciones del Incidente
        </span>
      </SidebarGroupLabel>
      <Separator className="my-2" />
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Back to list */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/organizations/${activeOrganization.slug}/incidents`}>
                <ChevronLeft className="h-4 w-4" />
                <span>Volver a la lista</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <Separator className="my-2" />

          {/* View Details */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={isDetailPage}
              disabled={isDetailPage}
            >
              <Link href={`/organizations/${activeOrganization.slug}/incidents/${currentIncidentId}`}>
                <Shield className="h-4 w-4" />
                <span>Ver detalles</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Edit */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={isEditPage}
              disabled={isEditPage}
            >
              <Link href={`/organizations/${activeOrganization.slug}/incidents/${currentIncidentId}/edit`}>
                <Edit className="h-4 w-4" />
                <span>Editar incidente</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* History */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={isHistoryPage}
              disabled={isHistoryPage}
            >
              <Link href={`/organizations/${activeOrganization.slug}/incidents/${currentIncidentId}/history`}>
                <History className="h-4 w-4" />
                <span>Ver historial</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}