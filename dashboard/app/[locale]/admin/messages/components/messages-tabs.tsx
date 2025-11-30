'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import { ContactMessagesTab } from './contact-messages-tab';
import { FeedbackMessagesTab } from './feedback-messages-tab';
import { ServiceRequestsTab } from './service-requests-tab';
import { MessagesStatistics } from './messages-statistics';
import { useTranslations } from '~/hooks/use-translations';

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

interface MessagesTabsProps {
  contactMessages: ContactMessage[];
  contactStats: MessageStatsProps;
  feedbackMessages: FeedbackMessage[];
  feedbackStats: FeedbackStatsProps;
  serviceRequests?: ServiceRequest[];
  serviceRequestStats?: ServiceRequestStatsProps;
  locale: string;
}

export function MessagesTabs({
  contactMessages,
  contactStats,
  feedbackMessages,
  feedbackStats,
  serviceRequests,
  serviceRequestStats,
  locale
}: MessagesTabsProps) {
  const { t } = useTranslations('admin/messages');

  // Calculate pending/unread service requests count
  const pendingServiceRequests = serviceRequestStats?.pending || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Unified Statistics Dashboard */}
      <MessagesStatistics
        contactStats={contactStats}
        feedbackStats={feedbackStats}
      />

      {/* Tabbed Interface */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services" className="relative flex items-center gap-2">
            {t('tabs.serviceRequests')}
            {pendingServiceRequests > 0 && (
              <Badge
                variant="default"
                className="bg-yellow-500 text-white hover:bg-yellow-600 px-2 py-0 h-5 text-xs"
              >
                {pendingServiceRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="relative flex items-center gap-2">
            {t('tabs.contactForms')}
            {contactStats.unread > 0 && (
              <Badge
                variant="default"
                className="bg-blue-500 text-white hover:bg-blue-600 px-2 py-0 h-5 text-xs"
              >
                {contactStats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="relative flex items-center gap-2">
            {t('tabs.userFeedback')}
            {feedbackStats.unread > 0 && (
              <Badge
                variant="default"
                className="bg-blue-500 text-white hover:bg-blue-600 px-2 py-0 h-5 text-xs"
              >
                {feedbackStats.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          {serviceRequests && serviceRequestStats ? (
            <ServiceRequestsTab
              serviceRequests={serviceRequests}
              stats={serviceRequestStats}
              locale={locale}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('serviceRequests.noDataAvailable')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactMessagesTab
            messages={contactMessages}
            stats={contactStats}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackMessagesTab
            messages={feedbackMessages}
            stats={feedbackStats}
            locale={locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}