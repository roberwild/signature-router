import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  User,
  Building2,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { auth } from '@workspace/auth';
// import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { contactMessageTable, organizationTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { AdminPageTitle } from '../../components/admin-page-title';

export const metadata: Metadata = {
  title: 'Contact Message Details | Admin Panel',
  description: 'View and manage contact message',
};

interface AdminContactDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

async function getContactMessage(id: string) {
  const [message] = await db
    .select({
      id: contactMessageTable.id,
      name: contactMessageTable.name,
      email: contactMessageTable.email,
      phone: contactMessageTable.phone,
      subject: contactMessageTable.subject,
      message: contactMessageTable.message,
      status: contactMessageTable.status,
      createdAt: contactMessageTable.createdAt,
      updatedAt: contactMessageTable.updatedAt,
      organizationId: contactMessageTable.organizationId,
      organizationName: organizationTable.name,
      organizationSlug: organizationTable.slug,
    })
    .from(contactMessageTable)
    .leftJoin(organizationTable, eq(contactMessageTable.organizationId, organizationTable.id))
    .where(eq(contactMessageTable.id, id))
    .limit(1);

  return message;
}

export default async function AdminContactDetailPage({ params }: AdminContactDetailPageProps) {
  const session = await auth();
  const { id, locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  // await requirePlatformAdmin();
  
  const message = await getContactMessage(id);
  
  if (!message) {
    notFound();
  }
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Contact Message Details" 
              info={`ID: ${message.id.slice(0, 8)}...`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Link href={`/${locale}/admin/contacts`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-5xl space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Details</CardTitle>
                  <CardDescription>Contact form submission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Subject</Label>
                    <p className="text-lg font-semibold">{message.subject}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-muted-foreground">Message</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: message.message }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Submitted</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{format(new Date(message.createdAt!), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge 
                        variant={message.status === 'unread' ? 'default' : 'secondary'}
                        className={message.status === 'unread' ? 'bg-blue-500 mt-1' : 'mt-1'}
                      >
                        {message.status === 'unread' ? 'Unread' : 'Read'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p>{message.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                        {message.email}
                      </a>
                    </div>
                  </div>
                  
                  {message.phone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p>{message.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {message.organizationName && (
                    <div>
                      <Label className="text-muted-foreground">Organization</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p>{message.organizationName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Actions */}
            <div className="space-y-6">
              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={async () => {
                    'use server';
                    
                    // Mark as read if unread
                    if (message.status === 'unread') {
                      await db
                        .update(contactMessageTable)
                        .set({ status: 'read', updatedAt: new Date() })
                        .where(eq(contactMessageTable.id, id));
                    }
                    
                    redirect(`/${locale}/admin/contacts/${id}`);
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={message.status === 'read'}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {message.status === 'read' ? 'Already Read' : 'Mark as Read'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${message.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Reply via Email
                    </a>
                  </Button>
                  
                  {message.phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a 
                        href={`https://wa.me/${message.phone.replace(/\D/g, '')}?text=Hola ${message.name}, somos de Minery Guard. Recibimos tu mensaje: "${message.subject}".`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact via WhatsApp
                      </a>
                    </Button>
                  )}
                  
                  {message.organizationId && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/${locale}/admin/organizations/${message.organizationId}`}>
                        <Building2 className="mr-2 h-4 w-4" />
                        View Organization
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}