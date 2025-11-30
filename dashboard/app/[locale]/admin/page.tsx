/**
 * Admin Dashboard Page
 * Main overview page for platform administrators
 * Displays key metrics, recent activity, and quick actions
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Target,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';

import { AdminPageTitle } from './components/admin-page-title';
import { MetricCard } from './components/metric-card';
import { getAdminMetrics } from '~/data/admin/get-metrics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Minery Guard',
  description: 'Panel de administración de la plataforma',
};

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Panel de Administración"
              info="Métricas y gestión de la plataforma"
            />
          </div>
        </PagePrimaryBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Ingresos Mensuales"
              value={`€${metrics.monthlyRevenue.toLocaleString()}`}
              description="MRR actual"
              icon={DollarSign}
              trend="up"
              trendValue="+12%"
            />
            <MetricCard
              title="Pipeline"
              value={`€${metrics.pipelineValue.toLocaleString()}`}
              description="Valor en proceso"
              icon={TrendingUp}
            />
            <MetricCard
              title="Tasa Conversión"
              value={`${metrics.conversionRate}%`}
              description="Leads → Clientes"
              icon={Target}
              color="success"
            />
            <MetricCard
              title="Organizaciones"
              value={metrics.organizations}
              description="Total activas"
              icon={Users}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Usuarios"
              value={metrics.users}
              description="Total registrados"
              icon={Users}
              color="primary"
            />
            <MetricCard
              title="Mensajes sin leer"
              value={metrics.unreadMessages}
              description="Requieren atención"
              icon={MessageSquare}
              color={metrics.unreadMessages > 5 ? 'warning' : 'primary'}
            />
            <MetricCard
              title="Solicitudes Pendientes"
              value={metrics.pendingServiceRequests}
              description="Por contactar"
              icon={FileText}
              color={metrics.pendingServiceRequests > 10 ? 'warning' : 'primary'}
            />
            <MetricCard
              title="Ticket Promedio"
              value={`€${metrics.avgDealSize.toLocaleString()}`}
              description="Por cliente"
              icon={DollarSign}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Service Requests */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Solicitudes de Servicio Recientes</CardTitle>
                      <CardDescription>
                        Últimas solicitudes de servicios premium
                      </CardDescription>
                    </div>
                    <Link href="/admin/services">
                      <Button variant="outline" size="sm">
                        Ver todas
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {metrics.recentRequests.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.recentRequests.map((request) => (
                        <Link
                          key={request.id}
                          href={`/admin/services/${request.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-singular-gray transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                request.status === 'contacted'
                                  ? 'bg-blue-100 dark:bg-blue-900/20'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20'
                              }`}
                            >
                              {request.status === 'contacted' ? (
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {request.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.organizationName} • {request.contactName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                request.status === 'contacted'
                                  ? 'secondary'
                                  : 'default'
                              }
                            >
                              {request.status === 'contacted'
                                ? 'Contactado'
                                : 'Pendiente'}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No hay solicitudes recientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Leads */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Leads Recientes</CardTitle>
                      <CardDescription>
                        Nuevos leads cualificados
                      </CardDescription>
                    </div>
                    <Link href="/admin/leads">
                      <Button variant="outline" size="sm">
                        Ver todos
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {metrics.recentLeads.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.recentLeads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/admin/leads/${lead.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-singular-gray transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {lead.organizationName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Score: {lead.leadScore}/100
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                lead.leadClassification === 'A1'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {lead.leadClassification}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No hay leads recientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Conversion Funnel */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Embudo de Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Leads</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.conversionFunnel.lead}
                        </span>
                      </div>
                      <Progress
                        value={100}
                        className="h-2 bg-singular-gray"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Cualificados</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.conversionFunnel.qualified}
                        </span>
                      </div>
                      <Progress
                        value={
                          (metrics.conversionFunnel.qualified /
                            metrics.conversionFunnel.lead) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Oportunidades</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.conversionFunnel.opportunity}
                        </span>
                      </div>
                      <Progress
                        value={
                          (metrics.conversionFunnel.opportunity /
                            metrics.conversionFunnel.lead) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Clientes</span>
                        <span className="text-sm text-muted-foreground">
                          {metrics.conversionFunnel.customer}
                        </span>
                      </div>
                      <Progress
                        value={
                          (metrics.conversionFunnel.customer /
                            metrics.conversionFunnel.lead) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      href="/admin/services"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-singular-gray transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Gestionar Solicitudes</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/admin/leads"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-singular-gray transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Revisar Leads</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/admin/messages"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-singular-gray transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Ver Mensajes</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
                    <Link
                      href="/admin/analytics"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-singular-gray transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Ver Analytics</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Link>
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
