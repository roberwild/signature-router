/**
 * Admin Leads Page
 * Manage and review qualified leads
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Target, TrendingUp, ArrowRight, Filter } from 'lucide-react';

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
import { Progress } from '@workspace/ui/components/progress';
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
  title: 'Leads | Admin',
  description: 'Gestión y cualificación de leads',
};

export default async function AdminLeadsPage() {
  // Mock data - replace with actual DB queries
  const leads = [
    {
      id: '1',
      organizationName: 'StartupXYZ',
      contactName: 'Carlos Ruiz',
      contactEmail: 'carlos@startupxyz.com',
      leadScore: 85,
      leadClassification: 'A1',
      mainConcern: 'security_level',
      complianceRequirements: ['GDPR', 'ISO 27001'],
      companySize: '11-50',
      recentIncidents: 'urgent',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      organizationName: 'MediCorp',
      contactName: 'Laura Fernández',
      contactEmail: 'laura@medicorp.es',
      leadScore: 62,
      leadClassification: 'B1',
      mainConcern: 'vulnerabilities',
      complianceRequirements: ['GDPR', 'ENS'],
      companySize: '51-200',
      recentIncidents: 'preventive',
      createdAt: new Date('2024-01-14'),
    },
    {
      id: '3',
      organizationName: 'TechSolutions',
      contactName: 'Pedro González',
      contactEmail: 'pedro@techsolutions.com',
      leadScore: 35,
      leadClassification: 'C1',
      mainConcern: 'no_team',
      complianceRequirements: ['GDPR'],
      companySize: '1-10',
      recentIncidents: 'unsure',
      createdAt: new Date('2024-01-13'),
    },
  ];

  const metrics = {
    total: leads.length,
    a1: leads.filter((l) => l.leadClassification === 'A1').length,
    b1: leads.filter((l) => l.leadClassification === 'B1').length,
    c1: leads.filter((l) => l.leadClassification === 'C1').length,
    avgScore: Math.round(
      leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length
    ),
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Leads Cualificados"
              info="Gestiona y revisa los leads capturados"
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por clasificación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="a1">A1 - Hot</SelectItem>
              <SelectItem value="b1">B1 - Warm</SelectItem>
              <SelectItem value="c1">C1 - Cold</SelectItem>
              <SelectItem value="d1">D1 - Info</SelectItem>
            </SelectContent>
          </Select>
        </PageActions>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Leads"
              value={metrics.total}
              description="Todos los leads"
              icon={Target}
            />
            <MetricCard
              title="Hot Leads (A1)"
              value={metrics.a1}
              description="Alta prioridad"
              icon={TrendingUp}
              color="danger"
            />
            <MetricCard
              title="Warm Leads (B1)"
              value={metrics.b1}
              description="Media prioridad"
              icon={TrendingUp}
              color="warning"
            />
            <MetricCard
              title="Score Promedio"
              value={metrics.avgScore}
              description="De 100"
              icon={Target}
            />
          </div>

          {/* Leads List */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Todos los Leads</CardTitle>
              <CardDescription>
                Leads ordenados por score de cualificación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads
                  .sort((a, b) => b.leadScore - a.leadScore)
                  .map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/admin/leads/${lead.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-singular-gray transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`p-3 rounded-lg ${
                            lead.leadClassification === 'A1'
                              ? 'bg-red-100'
                              : lead.leadClassification === 'B1'
                              ? 'bg-yellow-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          <Target
                            className={`h-5 w-5 ${
                              lead.leadClassification === 'A1'
                                ? 'text-red-600'
                                : lead.leadClassification === 'B1'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {lead.organizationName}
                            </p>
                            <Badge
                              variant={
                                lead.leadClassification === 'A1'
                                  ? 'destructive'
                                  : lead.leadClassification === 'B1'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {lead.leadClassification}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {lead.contactName} • {lead.contactEmail}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Score
                                </span>
                                <span className="text-xs font-medium">
                                  {lead.leadScore}/100
                                </span>
                              </div>
                              <Progress value={lead.leadScore} className="h-1.5" />
                            </div>
                            <div className="flex gap-1">
                              {lead.complianceRequirements.map((req) => (
                                <Badge
                                  key={req}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(lead.createdAt).toLocaleDateString('es-ES')}
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
