/**
 * Admin Service Requests Page
 * Manage all service requests from users
 */

import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';

import {
  Page,
  PageBody,
  PageHeader,
  PagePrimaryBar,
  PageActions,
} from '@workspace/ui/components/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import { AdminPageTitle } from '../components/admin-page-title';
import { MetricCard } from '../components/metric-card';

export const metadata: Metadata = {
  title: 'Solicitudes de Servicio | Admin',
  description: 'Gestión de solicitudes de servicios premium',
};

export default async function AdminServicesPage() {
  // Mock data - replace with actual DB queries
  const requests = [
    {
      id: '1',
      serviceName: 'Pentesting Avanzado',
      serviceType: 'pentest',
      organizationName: 'TechCorp SL',
      contactName: 'María García',
      contactEmail: 'maria@techcorp.es',
      contactPhone: '+34 600 111 222',
      status: 'pending',
      message: 'Necesitamos evaluar la seguridad de nuestra nueva aplicación',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      serviceName: 'CISO Virtual',
      serviceType: 'virtual_ciso',
      organizationName: 'InnovaBank',
      contactName: 'Juan Pérez',
      contactEmail: 'juan@innovabank.es',
      contactPhone: '+34 600 222 333',
      status: 'contacted',
      message: 'Queremos implementar un programa de seguridad completo',
      createdAt: new Date('2024-01-14'),
    },
    {
      id: '3',
      serviceName: 'Análisis Forense',
      serviceType: 'forensic',
      organizationName: 'SecureData Inc',
      contactName: 'Ana Martínez',
      contactEmail: 'ana@securedata.com',
      contactPhone: '+34 600 333 444',
      status: 'completed',
      message: 'Tuvimos un incidente y necesitamos investigación',
      createdAt: new Date('2024-01-10'),
    },
  ];

  const metrics = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    contacted: requests.filter((r) => r.status === 'contacted').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Solicitudes de Servicio"
              info="Gestiona las solicitudes de servicios premium"
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="contacted">Contactados</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Solicitudes"
              value={metrics.total}
              description="Todas las solicitudes"
              icon={FileText}
            />
            <MetricCard
              title="Pendientes"
              value={metrics.pending}
              description="Requieren contacto"
              icon={Clock}
              color="warning"
            />
            <MetricCard
              title="Contactados"
              value={metrics.contacted}
              description="En proceso"
              icon={CheckCircle}
              color="primary"
            />
            <MetricCard
              title="Completados"
              value={metrics.completed}
              description="Finalizados"
              icon={CheckCircle}
              color="success"
            />
          </div>

          {/* Requests List */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Todas las Solicitudes</CardTitle>
              <CardDescription>
                Lista completa de solicitudes de servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/admin/services/${request.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-singular-gray transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`p-3 rounded-lg ${
                          request.status === 'completed'
                            ? 'bg-green-100'
                            : request.status === 'contacted'
                            ? 'bg-blue-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        <FileText
                          className={`h-5 w-5 ${
                            request.status === 'completed'
                              ? 'text-green-600'
                              : request.status === 'contacted'
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {request.serviceName}
                          </p>
                          <Badge
                            variant={
                              request.status === 'completed'
                                ? 'default'
                                : request.status === 'contacted'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {request.status === 'pending'
                              ? 'Pendiente'
                              : request.status === 'contacted'
                              ? 'Contactado'
                              : 'Completado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.organizationName} • {request.contactName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.contactEmail} • {request.contactPhone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(request.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </Page>
  );
}
