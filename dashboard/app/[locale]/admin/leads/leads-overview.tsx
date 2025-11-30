'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  Filter,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCheck
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { markAllLeadsAsViewedAction } from '~/actions/admin/mark-lead-as-viewed';

function formatCompletionTime(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getMainConcernLabel(concern: string | null): string {
  const labels: Record<string, string> = {
    'security_concerns': 'Security Concerns',
    'cost_reduction': 'Cost Reduction',
    'compliance': 'Compliance',
    'operational_efficiency': 'Operational Efficiency',
    'digital_transformation': 'Digital Transformation',
    'unknown': 'Unknown'
  };
  return labels[concern || 'unknown'] || concern || 'Unknown';
}

function getClassificationColor(classification: string | null) {
  switch(classification) {
    case 'A1': return 'destructive';
    case 'B1': return 'secondary';
    case 'C1': return 'secondary';
    case 'D1': return 'outline';
    default: return 'outline';
  }
}

interface LeadsOverviewProps {
  leads: Array<{
    id: string;
    organizationName: string | null;
    leadClassification: string;
    isViewed?: boolean;
    [key: string]: unknown;
  }>;
  stats: {
    total: number;
    newThisWeek: number;
    qualified: number;
    avgScore: number;
    byClassification: {
      A1: number;
      B1: number;
      C1: number;
      D1: number;
    };
  };
  locale: string;
  currentUserId: string;
}

export function LeadsOverview({ leads, stats, locale, currentUserId }: LeadsOverviewProps) {
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  const unviewedCount = leads.filter(lead => !lead.isViewed).length;

  const handleMarkAllAsViewed = async () => {
    setIsMarkingAll(true);
    try {
      const result = await markAllLeadsAsViewedAction(currentUserId);
      if (result.success) {
        // Refresh the page to show updated view status
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to mark all leads as viewed:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">+{stats.newThisWeek} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground">Ready for outreach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hot Leads</CardTitle>
              <Target className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byClassification.A1}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Classification Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lead Classification Distribution</CardTitle>
              <CardDescription>Current leads by priority classification</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'analytics');
                router.push(url.pathname + '?' + url.searchParams.toString());
              }}
            >
              View Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="destructive">A1 - Hot</Badge>
                <span className="text-2xl font-bold">{stats.byClassification.A1}</span>
              </div>
              <p className="text-xs text-muted-foreground">Immediate response (15 min)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-orange-500">B1 - Warm</Badge>
                <span className="text-2xl font-bold">{stats.byClassification.B1}</span>
              </div>
              <p className="text-xs text-muted-foreground">Quick follow-up (24h)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">C1 - Cold</Badge>
                <span className="text-2xl font-bold">{stats.byClassification.C1}</span>
              </div>
              <p className="text-xs text-muted-foreground">Standard follow-up (72h)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">D1 - Info</Badge>
                <span className="text-2xl font-bold">{stats.byClassification.D1}</span>
              </div>
              <p className="text-xs text-muted-foreground">Nurture campaign</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest qualified leads requiring attention</CardDescription>
            </div>
            <div className="flex gap-2">
              {unviewedCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleMarkAllAsViewed}
                  disabled={isMarkingAll}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  {isMarkingAll 
                    ? (locale === 'es' ? 'Marcando...' : 'Marking...') 
                    : (locale === 'es' ? `Marcar ${unviewedCount} como vistos` : `Mark ${unviewedCount} as Viewed`)
                  }
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/${locale}/admin/leads/${lead.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    {lead.isViewed ? (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-blue-500" />
                    )}
                    <div className="font-medium">{lead.organizationName || 'Unknown Company'}</div>
                    <Badge 
                      variant={getClassificationColor(lead.leadClassification) as "default" | "secondary" | "destructive" | "outline"}
                      className={lead.leadClassification === 'B1' ? 'bg-orange-500' : ''}
                    >
                      {lead.leadClassification}
                    </Badge>
                    <Badge variant="outline">
                      Score: {(lead.leadScore as number) || 0}
                    </Badge>
                    {!lead.isViewed && (
                      <Badge variant="default" className="bg-blue-500">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{lead.userEmail as string || 'No email'}</span>
                    <span>•</span>
                    <span>{getMainConcernLabel(lead.mainConcern as string | null)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatCompletionTime(lead.completionTime as number | null)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.createdAt as string | Date), {
                      addSuffix: true,
                      locale: locale === 'es' ? es : undefined
                    })}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
          {leads.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No leads found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}