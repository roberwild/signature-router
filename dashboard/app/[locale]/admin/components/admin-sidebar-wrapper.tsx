import { getPageDictionary, type Locale } from '~/lib/i18n';
import { AdminSidebar } from './admin-sidebar';
import type { ProfileDto } from '~/types/dtos/profile-dto';

interface AdminSidebarWrapperProps {
  profile: ProfileDto;
  locale: string;
}

export async function AdminSidebarWrapper({ profile, locale }: AdminSidebarWrapperProps) {
  const dict = await getPageDictionary(locale as Locale, 'admin');
  
  return <AdminSidebar profile={profile} translations={dict} locale={locale} />;
}