'use client';

import { MessageCircle, Mail, TrendingUp, Tag, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useTranslations } from '~/hooks/use-translations';

interface MessagesStatisticsProps {
  contactStats: {
    total: number;
    unread: number;
    read: number;
    archived: number;
  };
  feedbackStats: {
    total: number;
    unread: number;
    read: number;
    archived: number;
    byCategory: {
      suggestion: number;
      problem: number;
      question: number;
    };
  };
}

export function MessagesStatistics({
  contactStats,
  feedbackStats
}: MessagesStatisticsProps) {
  const { t } = useTranslations('admin/messages');

  const totalMessages = contactStats.total + feedbackStats.total;
  const totalUnread = contactStats.unread + feedbackStats.unread;
  const totalRead = contactStats.read + feedbackStats.read;
  const totalArchived = contactStats.archived + feedbackStats.archived;
  const responseRate = totalMessages > 0
    ? Math.round(((totalRead + totalArchived) / totalMessages) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Messages Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('statistics.totalMessages')}</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <p className="text-xs text-muted-foreground">
            {contactStats.total} {t('statistics.contactsShort')}, {feedbackStats.total} {t('statistics.feedbackShort')}
          </p>
        </CardContent>
      </Card>

      {/* Unread Messages Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('statistics.unread')}</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{totalUnread}</div>
          <p className="text-xs text-muted-foreground">
            {contactStats.unread} {t('statistics.contactsShort')}, {feedbackStats.unread} {t('statistics.feedbackShort')}
          </p>
        </CardContent>
      </Card>

      {/* Read Messages Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('statistics.read')}</CardTitle>
          <Check className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRead}</div>
          <p className="text-xs text-muted-foreground">
            {t('statistics.reviewedMessages')}
          </p>
        </CardContent>
      </Card>

      {/* Response Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('statistics.responseRate')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responseRate}%</div>
          <p className="text-xs text-muted-foreground">{t('statistics.messagesHandled')}</p>
        </CardContent>
      </Card>

      {/* Category Breakdown Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('statistics.feedbackTypes')}</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{t('statistics.suggestions')}</span>
              <span className="font-medium">{feedbackStats.byCategory.suggestion}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{t('statistics.problems')}</span>
              <span className="font-medium text-orange-600">{feedbackStats.byCategory.problem}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{t('statistics.questions')}</span>
              <span className="font-medium">{feedbackStats.byCategory.question}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}