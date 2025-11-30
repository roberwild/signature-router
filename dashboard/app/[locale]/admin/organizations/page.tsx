import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, Calendar } from 'lucide-react';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { 
  organizationTable, 
  membershipTable
} from '@workspace/database/schema';
import { desc, sql } from 'drizzle-orm';
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
import { OrganizationsDataTable } from '~/components/admin/organizations-data-table';
import { getPageDictionary, type Locale } from '~/lib/i18n';

export const metadata: Metadata = {
  title: 'Organizations | Admin Panel',
  description: 'Manage platform organizations',
};

interface AdminOrganizationsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getOrganizationsWithLeadData() {
  const organizations = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
      memberCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM membership 
        WHERE membership."organizationId" = organization.id
      )`,
      owner: sql<{id: string, name: string, email: string, phone?: string | null} | null>`(
        SELECT json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'phone', NULL
        )
        FROM membership m
        INNER JOIN "user" u ON u.id = m."userId"
        WHERE m."organizationId" = organization.id
          AND m."isOwner" = true
        LIMIT 1
      )`,
      // Lead data - for single member orgs, show that member's lead data
      // For multi-member orgs, show aggregated data
      leadScore: sql<number | null>`(
        SELECT 
          CASE 
            WHEN COUNT(DISTINCT m."userId") = 1 THEN MAX(lq."leadScore")::int
            ELSE NULL
          END
        FROM membership m
        LEFT JOIN "leadQualification" lq ON lq."userId" = m."userId" AND lq."organizationId" = organization.id
        WHERE m."organizationId" = organization.id
      )`,
      leadClassification: sql<'A1' | 'B1' | 'C1' | 'D1' | null>`(
        SELECT 
          CASE 
            WHEN COUNT(DISTINCT m."userId") = 1 THEN 
              (SELECT lq."leadClassification" 
               FROM "leadQualification" lq 
               WHERE lq."userId" = (SELECT m2."userId" FROM membership m2 WHERE m2."organizationId" = organization.id LIMIT 1)
                 AND lq."organizationId" = organization.id
               ORDER BY lq."leadScore" DESC NULLS LAST
               LIMIT 1)
            ELSE NULL
          END
        FROM membership m
        WHERE m."organizationId" = organization.id
      )`,
      hasLeadData: sql<boolean>`(
        EXISTS(
          SELECT 1 FROM "leadQualification" lq
          INNER JOIN membership m ON m."userId" = lq."userId"
          WHERE m."organizationId" = organization.id
            AND lq."organizationId" = organization.id
        )
      )`,
      leadCount: sql<number>`(
        SELECT COUNT(DISTINCT lq."userId")::int
        FROM "leadQualification" lq
        INNER JOIN membership m ON m."userId" = lq."userId"
        WHERE m."organizationId" = organization.id
          AND lq."organizationId" = organization.id
      )`,
      avgLeadScore: sql<number | null>`(
        SELECT AVG(lq."leadScore")::int
        FROM "leadQualification" lq
        INNER JOIN membership m ON m."userId" = lq."userId"
        WHERE m."organizationId" = organization.id
          AND lq."organizationId" = organization.id
      )`,
      topLeadClassification: sql<'A1' | 'B1' | 'C1' | 'D1' | null>`(
        SELECT lq."leadClassification"
        FROM "leadQualification" lq
        INNER JOIN membership m ON m."userId" = lq."userId"
        WHERE m."organizationId" = organization.id
          AND lq."organizationId" = organization.id
        ORDER BY lq."leadScore" DESC NULLS LAST
        LIMIT 1
      )`,
    })
    .from(organizationTable)
    .orderBy(desc(organizationTable.name))
    .limit(200);

  return organizations;
}

async function getOrganizationStats() {
  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`0::int`, // Organization table doesn't have createdAt
      totalMembers: sql<number>`(SELECT COUNT(*)::int FROM ${membershipTable})`,
    })
    .from(organizationTable);

  return stats[0] || { total: 0, thisMonth: 0, totalMembers: 0 };
}

export default async function AdminOrganizationsPage({ params }: AdminOrganizationsPageProps) {
  const session = await auth();
  const { locale } = await params;
  const dict = await getPageDictionary(locale as Locale, 'admin/organizations');
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  await requirePlatformAdmin();
  
  const organizations = await getOrganizationsWithLeadData();
  const stats = await getOrganizationStats();
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title={dict.title || "Organizations"} 
              info={`${stats.total} ${dict.table?.total || "total"}`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Link href={`/${locale}/admin`}>
            <Button variant="outline">{dict.actions?.back || "Back to Dashboard"}</Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict.stats?.totalOrganizations || "Total Organizations"}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">{dict.stats?.allTime || "All time"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict.stats?.newThisMonth || "New This Month"}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">{dict.stats?.currentMonth || "Current month"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dict.stats?.totalMembers || "Total Members"}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">{dict.stats?.acrossAllOrganizations || "Across all organizations"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.cards?.allOrganizations || "All Organizations"}</CardTitle>
              <CardDescription>{dict.cards?.allOrganizationsDescription || "Manage and view all organizations with lead intelligence"}</CardDescription>
            </CardHeader>
            <CardContent>
              {organizations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{dict.empty?.noOrganizations || "No organizations yet"}</p>
                  <p className="text-sm text-muted-foreground">{dict.empty?.noOrganizationsDescription || "Organizations will appear here when created"}</p>
                </div>
              ) : (
                <OrganizationsDataTable
                  data={organizations}
                  locale={locale}
                  dict={dict}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}