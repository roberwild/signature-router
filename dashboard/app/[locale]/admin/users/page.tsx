import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import {
  userTable
} from '@workspace/database/schema';
import { desc, sql } from 'drizzle-orm';
import { UsersWrapper } from './users-wrapper';

export const metadata: Metadata = {
  title: 'Users | Admin Panel',
  description: 'Manage platform users',
};

interface AdminUsersPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getUsersWithLeadData() {
  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      phone: sql<string | null>`NULL`, // TODO: Add phone field if available in userTable
      image: userTable.image,
      emailVerified: userTable.emailVerified,
      isPlatformAdmin: userTable.isPlatformAdmin,
      createdAt: userTable.createdAt,
      organizationCount: sql<number>`(
        SELECT COUNT(DISTINCT m."organizationId")::int
        FROM "membership" m
        WHERE m."userId" = "user"."id"
      )`,
      // Lead qualification data (get the best score if multiple)
      leadScore: sql<number | null>`(
        SELECT MAX(lq."leadScore")::int
        FROM "leadQualification" lq
        WHERE lq."userId" = "user"."id"
      )`,
      leadClassification: sql<'A1' | 'B1' | 'C1' | 'D1' | null>`(
        SELECT lq."leadClassification"
        FROM "leadQualification" lq
        WHERE lq."userId" = "user"."id"
        ORDER BY lq."leadScore" DESC NULLS LAST
        LIMIT 1
      )`,
      hasLeadData: sql<boolean>`(
        EXISTS(
          SELECT 1 FROM "leadQualification" lq
          WHERE lq."userId" = "user"."id"
        )
      )`,
      lastLeadActivity: sql<Date | null>`(
        SELECT MAX(lq."updatedAt")
        FROM "leadQualification" lq
        WHERE lq."userId" = "user"."id"
      )`,
      totalLeadQualifications: sql<number>`(
        SELECT COUNT(*)::int
        FROM "leadQualification" lq
        WHERE lq."userId" = "user"."id"
      )`,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt))
    .limit(200);

  return users;
}

async function getUserStats() {
  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      verified: sql<number>`count(case when ${userTable.emailVerified} is not null then 1 end)::int`,
      admins: sql<number>`count(case when ${userTable.isPlatformAdmin} = true then 1 end)::int`,
      thisMonth: sql<number>`count(case when date_trunc('month', ${userTable.createdAt}) = date_trunc('month', CURRENT_DATE) then 1 end)::int`,
    })
    .from(userTable);

  return stats[0] || { total: 0, verified: 0, admins: 0, thisMonth: 0 };
}

export default async function AdminUsersPage({ params }: AdminUsersPageProps) {
  const session = await auth();
  const { locale } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  await requirePlatformAdmin();

  const users = await getUsersWithLeadData();
  const stats = await getUserStats();

  return (
    <UsersWrapper
      locale={locale}
      users={users}
      stats={stats}
    />
  );
}