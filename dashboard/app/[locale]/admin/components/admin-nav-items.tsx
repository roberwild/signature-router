/**
 * Admin Navigation Items
 * Defines the sidebar navigation structure for the admin panel
 */

import {
  BarChart3,
  Users,
  MessageSquare,
  Building2,
  TrendingUp,
  Settings,
  FileText,
  DollarSign,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
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
      icon: BarChart3,
    },
    {
      title: 'Solicitudes',
      href: `${localePrefix}/admin/services`,
      icon: FileText,
    },
    {
      title: 'Leads',
      href: `${localePrefix}/admin/leads`,
      icon: Target,
    },
    {
      title: 'Mensajes',
      href: `${localePrefix}/admin/messages`,
      icon: MessageSquare,
    },
    {
      title: 'Organizaciones',
      href: `${localePrefix}/admin/organizations`,
      icon: Building2,
    },
    {
      title: 'Usuarios',
      href: `${localePrefix}/admin/users`,
      icon: Users,
    },
    {
      title: 'Revenue',
      href: `${localePrefix}/admin/revenue`,
      icon: DollarSign,
    },
    {
      title: 'Analytics',
      href: `${localePrefix}/admin/analytics`,
      icon: TrendingUp,
    },
    {
      title: 'Configuración',
      href: `${localePrefix}/admin/configuration`,
      icon: Settings,
    },
  ];
}
