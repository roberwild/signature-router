import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database';
import { 
  organizationTable, 
  membershipTable, 
  userTable,
  serviceRequestTable,
  contactMessageTable
} from '@workspace/database/schema';
import { eq, sql } from 'drizzle-orm';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
// import { Separator } from '@workspace/ui/components/separator';
import { AdminPageTitle } from '../../components/admin-page-title';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { OrganizationActions } from '../components/organization-actions';

export const metadata: Metadata = {
  title: 'Organization Details | Admin Panel',
  description: 'View and manage organization',
};

interface AdminOrganizationDetailPageProps {
  params: {
    id: string;
    locale: string;
  };
}

async function getOrganizationDetails(id: string) {
  const [organization] = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
      memberCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${membershipTable} 
        WHERE ${membershipTable.organizationId} = ${organizationTable.id}
      )`,
      serviceRequestCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${serviceRequestTable} 
        WHERE ${serviceRequestTable.organizationId} = ${organizationTable.id}
      )`,
      contactMessageCount: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${contactMessageTable} 
        WHERE ${contactMessageTable.organizationId} = ${organizationTable.id}
      )`,
    })
    .from(organizationTable)
    .where(eq(organizationTable.id, id))
    .limit(1);

  return organization;
}

async function getOrganizationMembers(organizationId: string) {
  const members = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: membershipTable.role,
      joinedAt: membershipTable.createdAt,
    })
    .from(membershipTable)
    .innerJoin(userTable, eq(membershipTable.userId, userTable.id))
    .where(eq(membershipTable.organizationId, organizationId))
    .limit(10);

  return members;
}

async function getRecentServiceRequests(organizationId: string) {
  const requests = await db
    .select({
      id: serviceRequestTable.id,
      serviceName: serviceRequestTable.serviceName,
      status: serviceRequestTable.status,
      createdAt: serviceRequestTable.createdAt,
      contactName: serviceRequestTable.contactName,
    })
    .from(serviceRequestTable)
    .where(eq(serviceRequestTable.organizationId, organizationId))
    .orderBy(sql`${serviceRequestTable.createdAt} DESC`)
    .limit(5);

  return requests;
}

export default async function AdminOrganizationDetailPage({ params }: AdminOrganizationDetailPageProps) {
  const session = await auth();
  const { id, locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  await requirePlatformAdmin();
  
  const organization = await getOrganizationDetails(id);
  
  if (!organization) {
    notFound();
  }
  
  const members = await getOrganizationMembers(id);
  const recentRequests = await getRecentServiceRequests(id);
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title={organization.name} 
              info={`Org ID: ${organization.id.slice(0, 8)}...`}
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <OrganizationActions 
            organization={organization}
            locale={locale}
          />
          <Link href={`/${locale}/admin/organizations`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Organization Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="text-lg font-semibold">{organization.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground">Slug</Label>
                      <p className="font-mono">/{organization.slug}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Member Count</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">{organization.memberCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Members</CardTitle>
                    <Badge variant="secondary">{organization.memberCount} total</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>
                              <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                                {member.email}
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(member.joinedAt), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Service Requests */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Service Requests</CardTitle>
                    <Link href={`/${locale}/admin/services?org=${id}`}>
                      <Button size="sm" variant="ghost">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No service requests</p>
                  ) : (
                    <div className="space-y-3">
                      {recentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{request.serviceName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.contactName} • {format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === 'completed' ? 'default' : 
                            request.status === 'in-progress' ? 'secondary' : 
                            'outline'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Stats & Actions */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Members</span>
                    </div>
                    <span className="font-bold">{organization.memberCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Service Requests</span>
                    </div>
                    <span className="font-bold">{organization.serviceRequestCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Contact Messages</span>
                    </div>
                    <span className="font-bold">{organization.contactMessageCount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${locale}/organizations/${organization.slug}/home`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Organization
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${locale}/admin/services?org=${id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Service Requests
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/${locale}/admin/contacts?org=${id}`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      View Contact Messages
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}