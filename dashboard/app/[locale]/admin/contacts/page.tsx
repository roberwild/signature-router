import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Mail, Check } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: Date | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
}

import { auth } from '@workspace/auth';
// import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { contactMessageTable, organizationTable } from '@workspace/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
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
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { AdminPageTitle } from '../components/admin-page-title';
import { ContactMessagesTable } from '~/components/admin/contact-messages-table';

export const metadata: Metadata = {
  title: 'Contact Messages | Admin Panel',
  description: 'Manage contact form submissions',
};

interface AdminContactMessagesPageProps {
  params: {
    locale: string;
  };
}

async function getContactMessages() {
  const messages = await db
    .select({
      id: contactMessageTable.id,
      name: contactMessageTable.name,
      email: contactMessageTable.email,
      phone: contactMessageTable.phone,
      subject: contactMessageTable.subject,
      message: contactMessageTable.message,
      status: contactMessageTable.status,
      createdAt: contactMessageTable.createdAt,
      organizationId: contactMessageTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
    })
    .from(contactMessageTable)
    .leftJoin(organizationTable, eq(contactMessageTable.organizationId, organizationTable.id))
    .orderBy(desc(contactMessageTable.createdAt))
    .limit(100);

  return messages;
}

async function getMessageStats() {
  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      unread: sql<number>`count(case when status = 'unread' then 1 end)::int`,
      read: sql<number>`count(case when status = 'read' then 1 end)::int`,
    })
    .from(contactMessageTable);

  return stats[0] || { total: 0, unread: 0, read: 0 };
}

export default async function AdminContactMessagesPage({ params }: AdminContactMessagesPageProps) {
  const session = await auth();
  const { locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // await requirePlatformAdmin();
  
  const messages = await getContactMessages();
  const stats = await getMessageStats();
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Contact Messages" 
              info={`${stats.total} messages`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Link href={`/${locale}/admin`}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unread}</div>
                <p className="text-xs text-muted-foreground">Pending review</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Read</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.read}</div>
                <p className="text-xs text-muted-foreground">Reviewed</p>
              </CardContent>
            </Card>
          </div>

          {/* Messages Table with Enhanced UX */}
          <ContactMessagesTable messages={messages as ContactMessage[]} locale={locale} />
        </div>
      </PageBody>
    </Page>
  );
}