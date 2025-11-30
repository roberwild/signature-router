'use client';

import Link from 'next/link';
import { Users, Calendar, Shield, UserCheck } from 'lucide-react';

import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { AdminPageTitle } from '../components/admin-page-title';
import { UsersDataTable } from '~/components/admin/users-data-table';
import { useTranslations } from '~/hooks/use-translations';

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

interface UsersPageContentProps {
  users: UserData[];
  stats: UsersStats;
  locale: string;
}

export function UsersPageContent({ users, stats, locale }: UsersPageContentProps) {
  const { t } = useTranslations('admin/users');

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title={t('pageTitle')}
              info={`${stats.total} total`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Link href={`/${locale}/admin`}>
            <Button variant="outline">{t('backToDashboard')}</Button>
          </Link>
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('statsCards.totalUsers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">{t('statsCards.allTime')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('statsCards.verified')}</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.verified}</div>
                <p className="text-xs text-muted-foreground">{t('statsCards.emailVerified')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('statsCards.admins')}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admins}</div>
                <p className="text-xs text-muted-foreground">{t('statsCards.platformAdmins')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('statsCards.newThisMonth')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">{t('statsCards.currentMonth')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('usersTable.title')}</CardTitle>
              <CardDescription>{t('usersTable.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('usersTable.emptyState.title')}</p>
                  <p className="text-sm text-muted-foreground">{t('usersTable.emptyState.description')}</p>
                </div>
              ) : (
                <UsersDataTable
                  data={users}
                  locale={locale}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}