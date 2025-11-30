import { getPageDictionary, type Locale } from '~/lib/i18n';
import { UsersPageContent } from './users-page-content';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { getSharedDictionary } from '@/lib/i18n';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  isPlatformAdmin: boolean;
  createdAt: Date;
  updatedAt?: Date;
  organizationCount: number;
  serviceRequestCount?: number;
  // Lead qualification data
  leadScore?: number | null;
  leadClassification?: 'A1' | 'B1' | 'C1' | 'D1' | null;
  hasLeadData: boolean;
  lastLeadActivity?: Date | null;
  totalLeadQualifications?: number;
}

interface UsersStats {
  total: number;
  verified: number;
  admins: number;
  thisMonth: number;
}

interface UsersWrapperProps {
  locale: string;
  users: UserData[];
  stats: UsersStats;
}

export async function UsersWrapper({ locale, users, stats }: UsersWrapperProps) {
  const usersDict = await getPageDictionary(locale as Locale, 'admin/users');

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/users': usersDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/users', 'common', 'navigation', 'forms']}
    >
      <UsersPageContent users={users} stats={stats} locale={locale} />
    </TranslationProvider>
  );
}