import * as React from 'react';
import type { Metadata } from 'next';
import { auth } from '@workspace/auth';

interface NextPageProps {
  params: Promise<{ slug: string }>;
}
import { redirect } from 'next/navigation';
import { ContactForm } from '~/src/features/services/components/contact-form';
import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Mail, Phone, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { db, eq } from '@workspace/database/client';
import { organizationTable } from '@workspace/database/schema';

export const metadata: Metadata = {
  title: 'Contacto - Minery Report'
};

export default async function ContactPage(
  props: NextPageProps
): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }
  
  const params = await props.params;
  
  // Get the organization by slug
  const [organization] = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
    })
    .from(organizationTable)
    .where(eq(organizationTable.slug, params.slug))
    .limit(1);
  
  if (!organization) {
    redirect('/organizations');
  }
  
  const organizationId = organization.id;

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <OrganizationPageTitle
            title="Contacto con Minery Report"
            info="Ponte en contacto con nuestro equipo de expertos en ciberseguridad"
          />
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="container mx-auto py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Form - Main Content */}
            <div className="lg:col-span-2">
              <ContactForm organizationId={organizationId} />
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:contacto@mineryreport.com"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        contacto@mineryreport.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Teléfono</p>
                      <a
                        href="tel:+34919049788"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        +34 91 904 97 88
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-sm text-muted-foreground">
                        Av. Juan Carlos I, 13<br />
                        28806 Alcalá de Henares, Madrid
                      </p>
                      <a
                        href="https://maps.app.goo.gl/dCEHhHvN6aKrQWjQ6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-1 inline-block"
                      >
                        Ver en Google Maps →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours Card */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Horario de Atención</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Día</TableHead>
                        <TableHead className="font-semibold text-center">Horario</TableHead>
                        <TableHead className="font-semibold text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { day: 'Lunes', hours: '9:00 - 15:00', open: true },
                        { day: 'Martes', hours: '9:00 - 15:00', open: true },
                        { day: 'Miércoles', hours: '9:00 - 15:00', open: true },
                        { day: 'Jueves', hours: '9:00 - 15:00', open: true },
                        { day: 'Viernes', hours: '9:00 - 15:00', open: true },
                        { day: 'Sábado', hours: 'Cerrado', open: false },
                        { day: 'Domingo', hours: 'Cerrado', open: false },
                      ].map((schedule) => (
                        <TableRow key={schedule.day} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {schedule.day}
                          </TableCell>
                          <TableCell className="text-center">
                            {schedule.open ? (
                              <span className="font-mono text-sm">{schedule.hours}</span>
                            ) : (
                              <span className="text-muted-foreground">{schedule.hours}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {schedule.open ? (
                              <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Abierto
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Cerrado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="px-6 py-3 border-t bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Horario de España (CET/CEST)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}