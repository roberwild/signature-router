/**
 * Admin Messages Page
 * Manage contact messages from potential clients
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Mail, MailOpen, ArrowRight, Filter } from 'lucide-react';

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
  title: 'Mensajes | Admin',
  description: 'Gestión de mensajes de contacto',
};

export default async function AdminMessagesPage() {
  // Mock data - replace with actual DB queries
  const messages = [
    {
      id: '1',
      from: 'Roberto Sánchez',
      email: 'roberto@empresa.com',
      organization: 'Empresa Tech SL',
      subject: 'Consulta sobre servicios de pentesting',
      message: '¿Pueden ayudarnos con una auditoría de seguridad?',
      status: 'unread',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      from: 'Isabel Moreno',
      email: 'isabel@startup.io',
      organization: 'Startup Innovation',
      subject: 'Interesados en CISO Virtual',
      message: 'Queremos contratar un CISO virtual para nuestra startup',
      status: 'read',
      createdAt: new Date('2024-01-14'),
    },
    {
      id: '3',
      from: 'Miguel Torres',
      email: 'miguel@corporacion.es',
      organization: 'Corporación Grande',
      subject: 'Incidente de seguridad',
      message: 'Necesitamos ayuda urgente con un posible incidente',
      status: 'unread',
      createdAt: new Date('2024-01-13'),
    },
  ];

  const metrics = {
    total: messages.length,
    unread: messages.filter((m) => m.status === 'unread').length,
    read: messages.filter((m) => m.status === 'read').length,
    today: messages.filter(
      (m) =>
        new Date(m.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Mensajes de Contacto"
              info="Gestiona los mensajes recibidos"
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
              <SelectItem value="unread">No leídos</SelectItem>
              <SelectItem value="read">Leídos</SelectItem>
            </SelectContent>
          </Select>
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Mensajes"
              value={metrics.total}
              description="Todos los mensajes"
              icon={MessageSquare}
            />
            <MetricCard
              title="Sin Leer"
              value={metrics.unread}
              description="Requieren atención"
              icon={Mail}
              color="warning"
            />
            <MetricCard
              title="Leídos"
              value={metrics.read}
              description="Ya revisados"
              icon={MailOpen}
              color="success"
            />
            <MetricCard
              title="Hoy"
              value={metrics.today}
              description="Recibidos hoy"
              icon={MessageSquare}
            />
          </div>

          {/* Messages List */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Todos los Mensajes</CardTitle>
              <CardDescription>
                Mensajes de contacto ordenados por fecha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((message) => (
                  <Link
                    key={message.id}
                    href={`/admin/messages/${message.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-singular-gray transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`p-3 rounded-lg ${
                          message.status === 'unread'
                            ? 'bg-yellow-100'
                            : 'bg-green-100'
                        }`}
                      >
                        {message.status === 'unread' ? (
                          <Mail className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <MailOpen className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{message.from}</p>
                          {message.status === 'unread' && (
                            <Badge variant="default">Nuevo</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {message.subject}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {message.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.organization} • {message.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(message.createdAt).toLocaleDateString(
                          'es-ES'
                        )}
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
