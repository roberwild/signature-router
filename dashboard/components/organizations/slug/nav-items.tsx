import {
  BellIcon,
  CodeIcon,
  CreditCardIcon,
  HomeIcon,
  LockKeyholeIcon,
  SettingsIcon,
  StoreIcon,
  UserIcon,
  UserPlus2Icon,
  FileWarning,
  TrendingUp,
  Briefcase,
  FileText,
  ClipboardList
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon: LucideIcon;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

interface NavTranslations {
  main?: {
    home?: string;
    services?: string;
    serviceRequests?: string;
    assessments?: string;
    incidents?: string;
    settings?: string;
    premiumSection?: string;
    mineryServices?: string;
    virtualAdvisor?: string;
  };
  userMenu?: {
    profile?: string;
    security?: string;
    notifications?: string;
  };
  organizationMenu?: {
    general?: string;
    members?: string;
    billing?: string;
    developers?: string;
  };
}

export function createMainNavSections(slug: string, locale?: string, translations?: NavTranslations): NavSection[] {
  const localePrefix = locale ? `/${locale}` : '';
  const t = translations?.main || {};
  return [
    {
      items: [
        {
          title: t.home || 'Home',
          href: `${localePrefix}/organizations/${slug}/home`,
          icon: HomeIcon
        }
      ]
    },
    {
      items: [
        {
          title: t.assessments || 'Nuestras Autoevaluaciones',
          href: `${localePrefix}/organizations/${slug}/assessments`,
          icon: ClipboardList
        },
        // {
        //   title: t.cis18 || 'CIS-18',
        //   href: `${localePrefix}/organizations/${slug}/cis-18`,
        //   icon: Shield
        // },
        {
          title: t.incidents || 'Nuestros Incidentes',
          href: `${localePrefix}/organizations/${slug}/incidents`,
          icon: FileWarning
        }
      ]
    },
    {
      title: t.premiumSection || 'Servicios Premium',
      items: [
        {
          title: t.mineryServices || 'Servicios Minery',
          href: `${localePrefix}/organizations/${slug}/services`,
          icon: Briefcase
        },
        // Virtual Advisor - hidden until ready for production
        // {
        //   title: t.virtualAdvisor || 'Asesor Virtual',
        //   href: `${localePrefix}/organizations/${slug}/chatbot`,
        //   icon: MessageSquareText
        // },
        {
          title: t.serviceRequests || 'Mis Solicitudes',
          href: `${localePrefix}/organizations/${slug}/services/requests`,
          icon: FileText
        }
      ]
    },
    {
      items: [
        {
          title: t.settings || 'Configuración',
          href: `${localePrefix}/organizations/${slug}/settings`,
          icon: SettingsIcon
        }
      ]
    }
  ];
}

export function createMainNavItems(slug: string, locale?: string, translations?: NavTranslations): NavItem[] {
  const localePrefix = locale ? `/${locale}` : '';
  const t = translations?.main || {};
  return [
    {
      title: t.home || 'Home',
      href: `${localePrefix}/organizations/${slug}/home`,
      icon: HomeIcon
    },
    {
      title: t.services || 'Premium Services',
      href: `${localePrefix}/organizations/${slug}/services`,
      icon: Briefcase
    },
    {
      title: t.serviceRequests || 'Mis Solicitudes',
      href: `${localePrefix}/organizations/${slug}/services/requests`,
      icon: FileText
    },
    {
      title: t.assessments || 'Self-Assessment',
      href: `${localePrefix}/organizations/${slug}/assessments`,
      icon: TrendingUp
    },
    // {
    //   title: t.cis18 || 'CIS-18',
    //   href: `${localePrefix}/organizations/${slug}/cis-18`,
    //   icon: Shield
    // },
    {
      title: t.incidents || 'Incidents',
      href: `${localePrefix}/organizations/${slug}/incidents`,
      icon: FileWarning
    },
    // {
    //   title: 'Contacts',
    //   href: replaceOrgSlug(routes.dashboard.organizations.slug.Contacts, slug),
    //   icon: UsersIcon
    // },
    {
      title: t.settings || 'Settings',
      href: `${localePrefix}/organizations/${slug}/settings`,
      icon: SettingsIcon
    }
  ];
}

export function createAccountNavItems(slug: string, locale?: string, translations?: NavTranslations): NavItem[] {
  const localePrefix = locale ? `/${locale}` : '';
  const t = translations?.userMenu || {};
  return [
    {
      title: t.profile || 'Profile',
      href: `${localePrefix}/organizations/${slug}/settings/account/profile`,
      icon: UserIcon
    },
    {
      title: t.security || 'Security',
      href: `${localePrefix}/organizations/${slug}/settings/account/security`,
      icon: LockKeyholeIcon
    },
    {
      title: t.notifications || 'Notifications',
      href: `${localePrefix}/organizations/${slug}/settings/account/notifications`,
      icon: BellIcon
    }
  ];
}

export function createOrganizationNavItems(slug: string, locale?: string, translations?: NavTranslations): NavItem[] {
  const localePrefix = locale ? `/${locale}` : '';
  const t = translations?.organizationMenu || {};
  return [
    {
      title: t.general || 'General',
      href: `${localePrefix}/organizations/${slug}/settings/organization/general`,
      icon: StoreIcon
    },
    {
      title: t.members || 'Members',
      href: `${localePrefix}/organizations/${slug}/settings/organization/members`,
      icon: UserPlus2Icon
    },
    {
      title: t.billing || 'Billing',
      href: `${localePrefix}/organizations/${slug}/settings/organization/billing`,
      icon: CreditCardIcon
    },
    {
      title: t.developers || 'Developers',
      href: `${localePrefix}/organizations/${slug}/settings/organization/developers`,
      icon: CodeIcon
    }
  ];
}
