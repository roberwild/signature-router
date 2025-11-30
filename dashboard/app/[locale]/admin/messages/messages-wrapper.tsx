import { getPageDictionary, type Locale } from '~/lib/i18n';
import { getSharedDictionary } from '@/lib/i18n';
import { TranslationProvider } from '@/components/providers/translation-provider';
import { MessagesTabs } from './components/messages-tabs';

interface MessageStatsProps {
  total: number;
  unread: number;
  read: number;
  archived: number;
}

interface FeedbackStatsProps extends MessageStatsProps {
  byCategory: {
    suggestion: number;
    problem: number;
    question: number;
  };
}

interface ServiceRequestStatsProps {
  total: number;
  pending: number;
  contacted: number;
  inProgress: number;
  completed: number;
  withMessages: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: Date | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
}

interface FeedbackMessage {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  category: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: Date | null;
}

interface ServiceRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  serviceName: string;
  serviceType: string | null;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed';
  message: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MessagesWrapperProps {
  contactMessages: ContactMessage[];
  contactStats: MessageStatsProps;
  feedbackMessages: FeedbackMessage[];
  feedbackStats: FeedbackStatsProps;
  serviceRequests?: ServiceRequest[];
  serviceRequestStats?: ServiceRequestStatsProps;
  locale: string;
}

export async function MessagesWrapper({
  contactMessages,
  contactStats,
  feedbackMessages,
  feedbackStats,
  serviceRequests,
  serviceRequestStats,
  locale
}: MessagesWrapperProps) {
  const messagesDict = await getPageDictionary(locale as Locale, 'admin/messages');

  // Load the necessary shared dictionaries
  const dictionaries: Record<string, unknown> = {
    'admin/messages': messagesDict,
    'common': await getSharedDictionary(locale as Locale, 'common'),
    'navigation': await getSharedDictionary(locale as Locale, 'navigation'),
    'forms': await getSharedDictionary(locale as Locale, 'forms'),
  };

  return (
    <TranslationProvider
      initialLocale={locale as Locale}
      initialDictionaries={dictionaries}
      namespaces={['admin/messages', 'common', 'navigation', 'forms']}
    >
      <MessagesTabs
        contactMessages={contactMessages}
        contactStats={contactStats}
        feedbackMessages={feedbackMessages}
        feedbackStats={feedbackStats}
        serviceRequests={serviceRequests}
        serviceRequestStats={serviceRequestStats}
        locale={locale}
      />
    </TranslationProvider>
  );
}