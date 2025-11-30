import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Building2,
  User,
  Archive as ArchiveIcon,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { contactMessageTable, organizationTable, feedbackTable, userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
  PageActions,
} from '@workspace/ui/components/page';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { AdminPageTitle } from '../../components/admin-page-title';
import { MessageActions } from '../components/message-actions';

export const metadata: Metadata = {
  title: 'Message Details | Admin Panel',
  description: 'View message details',
};

type ContactMessageData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: string | null;
  createdAt: Date;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
};

type FeedbackMessageData = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  category: string | null;
  message: string | null;
  status: string | null;
  createdAt: Date;
};

interface MessageDetailsPageProps {
  params: {
    locale: string;
    id: string;
  };
}

async function getMessage(id: string) {
  // First try to get as contact message
  const contactMessage = await db
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
    .where(eq(contactMessageTable.id, id))
    .limit(1);

  if (contactMessage.length > 0) {
    return {
      type: 'contact' as const,
      data: contactMessage[0]
    };
  }

  // If not found, try as feedback message
  const feedbackMessage = await db
    .select({
      id: feedbackTable.id,
      userId: feedbackTable.userId,
      userName: userTable.name,
      userEmail: userTable.email,
      organizationId: feedbackTable.organizationId,
      organizationName: organizationTable.name,
      category: feedbackTable.category,
      message: feedbackTable.message,
      status: feedbackTable.status,
      createdAt: feedbackTable.createdAt,
    })
    .from(feedbackTable)
    .leftJoin(userTable, eq(feedbackTable.userId, userTable.id))
    .leftJoin(organizationTable, eq(feedbackTable.organizationId, organizationTable.id))
    .where(eq(feedbackTable.id, id))
    .limit(1);

  if (feedbackMessage.length > 0) {
    return {
      type: 'feedback' as const,
      data: feedbackMessage[0]
    };
  }

  return null;
}

const categoryLabels: Record<string, string> = {
  'suggestion': 'Suggestion',
  'problem': 'Problem',
  'question': 'Question'
};

const categoryColors: Record<string, string> = {
  'suggestion': 'default',
  'problem': 'destructive',
  'question': 'secondary'
};

export default async function MessageDetailsPage({ params }: MessageDetailsPageProps) {
  const session = await auth();
  const { locale, id } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  const message = await getMessage(id);
  
  if (!message) {
    notFound();
  }

  const isContact = message.type === 'contact';
  const data = message.data;
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Message Details" 
              info={isContact ? 'Contact Form' : 'User Feedback'}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <MessageActions 
            messageId={id}
            messageType={message.type}
            currentStatus={data.status as "unread" | "read" | "archived"}
            locale={locale}
          />
          <Link href={`/${locale}/admin/messages`}>
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
                  <CardDescription>
                    {isContact ? 'Contact form submission' : 'User feedback'}
                  </CardDescription>
                  {!isContact && 'category' in data && (
                    <Badge variant={(categoryColors[data.category as string] as "default" | "secondary" | "destructive" | "outline") || 'default'} className="mt-2">
                      {categoryLabels[data.category] || data.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isContact && 'subject' in data && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Subject</Label>
                        <p className="text-lg font-semibold">{data.subject}</p>
                      </div>
                      
                      <Separator />
                    </>
                  )}
                  
                  <div>
                    <Label className="text-muted-foreground">Message</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: data.message }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Submitted</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy HH:mm") : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge 
                        variant={data.status === 'unread' ? 'default' : 'secondary'}
                        className={data.status === 'unread' ? 'bg-blue-500 mt-1' : 'mt-1'}
                      >
                        {data.status === 'unread' ? 'Unread' : data.status === 'archived' ? 'Archived' : 'Read'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{isContact ? 'Contact' : 'User'} Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p>{isContact ? (data as ContactMessageData).name : ((data as FeedbackMessageData).userName || 'Unknown User')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${isContact ? (data as ContactMessageData).email : (data as FeedbackMessageData).userEmail || ''}`} 
                        className="text-primary hover:underline"
                      >
                        {isContact ? (data as ContactMessageData).email : (data as FeedbackMessageData).userEmail || 'N/A'}
                      </a>
                    </div>
                  </div>
                  
                  {isContact && (data as ContactMessageData).phone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p>{(data as ContactMessageData).phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {data.organizationName && (
                    <div>
                      <Label className="text-muted-foreground">Organization</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p>{data.organizationName}</p>
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
                    if (data.status === 'unread') {
                      if (isContact) {
                        await db
                          .update(contactMessageTable)
                          .set({ status: 'read', updatedAt: new Date() })
                          .where(eq(contactMessageTable.id, id));
                      } else {
                        await db
                          .update(feedbackTable)
                          .set({ status: 'read', updatedAt: new Date() })
                          .where(eq(feedbackTable.id, id));
                      }
                    }
                    
                    redirect(`/${locale}/admin/messages/${id}`);
                  }}>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={data.status === 'read'}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {data.status === 'read' ? 'Already Read' : 'Mark as Read'}
                    </Button>
                  </form>
                  
                  {data.status !== 'archived' && (
                    <form action={async () => {
                      'use server';
                      
                      if (isContact) {
                        await db
                          .update(contactMessageTable)
                          .set({ status: 'archived', updatedAt: new Date() })
                          .where(eq(contactMessageTable.id, id));
                      } else {
                        await db
                          .update(feedbackTable)
                          .set({ status: 'archived', updatedAt: new Date() })
                          .where(eq(feedbackTable.id, id));
                      }
                      
                      redirect(`/${locale}/admin/messages`);
                    }} className="mt-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        variant="outline"
                      >
                        <ArchiveIcon className="mr-2 h-4 w-4" />
                        Archive Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${isContact ? (data as ContactMessageData).email : (data as FeedbackMessageData).userEmail || ''}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Reply via Email
                    </a>
                  </Button>
                  
                  {isContact && (data as ContactMessageData).phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a 
                        href={`https://wa.me/${((data as ContactMessageData).phone || '').replace(/\D/g, '')}?text=Hola ${(data as ContactMessageData).name}, recibimos tu mensaje: "${(data as ContactMessageData).subject}".`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact via WhatsApp
                      </a>
                    </Button>
                  )}
                  
                  {data.organizationId && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/${locale}/admin/organizations/${data.organizationId}`}>
                        <Building2 className="mr-2 h-4 w-4" />
                        View Organization
                      </Link>
                    </Button>
                  )}
                  
                  {!isContact && 'userId' in data && data.userId && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/${locale}/admin/users/${data.userId}`}>
                        <User className="mr-2 h-4 w-4" />
                        View User Profile
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