'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Progress } from '@workspace/ui/components/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Target,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Award,
  Brain,
  Star,
  ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';
import type { LeadScoringData } from '~/data/admin/get-lead-scoring';

interface LeadScoringDashboardProps {
  initialData: LeadScoringData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LeadScoringDashboard({ initialData }: LeadScoringDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'activity' | 'risk'>('score');

  const { data, error, isLoading, mutate } = useSWR<LeadScoringData>(
    `/api/admin/lead-scoring?category=${selectedCategory}&sort=${sortBy}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  const handleRefresh = () => {
    mutate();
    toast.success('Lead scores refreshed');
  };

  const handleRecalculateScores = async () => {
    try {
      const response = await fetch('/api/admin/lead-scoring/recalculate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate scores');
      }

      mutate();
      toast.success('Lead scores recalculated');
    } catch (_error) {
      toast.error('Failed to recalculate scores');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Hot</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800">Warm</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Cool</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Cold</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="mr-1 h-3 w-3" />Medium</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />High</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Lead Scores</CardTitle>
          <CardDescription>
            Failed to load lead scoring data. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data for factor analysis
  const radarData = Object.entries(data.factorAnalysis).map(([key, value]) => {
    return {
      factor: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      score: value.avg,
      weight: value.weight * 100,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Scoring Overview</h2>
          <p className="text-muted-foreground">
            AI-powered lead quality assessment and prioritization
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleRecalculateScores} variant="outline" size="sm">
            <Brain className="mr-2 h-4 w-4" />
            Recalculate All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.insights.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value Leads</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.insights.highValueLeads}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 80 ({data.insights.totalLeads > 0 ? Math.round((data.insights.highValueLeads / data.insights.totalLeads) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Leads</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.insights.atRiskLeads}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.insights.avgScore}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${data.insights.avgScore}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Top Leads</TabsTrigger>
          <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          <TabsTrigger value="factors">Factor Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lead Leaderboard</CardTitle>
                  <CardDescription>
                    Top performing leads ranked by score
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="A1">A1 - Hot</SelectItem>
                      <SelectItem value="B1">B1 - Warm</SelectItem>
                      <SelectItem value="C1">C1 - Cool</SelectItem>
                      <SelectItem value="D1">D1 - Cold</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: 'score' | 'activity' | 'risk') => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="activity">Last Activity</SelectItem>
                      <SelectItem value="risk">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Completed Sessions</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Recommendations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topLeads.map((lead, index: number) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Star className="h-4 w-4 text-yellow-500 mr-2" />
                          ) : (
                            <span className="w-4 mr-2">#{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{lead.email}</div>
                        <div className="text-sm text-muted-foreground">ID: {lead.id.substring(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{lead.score}</span>
                          {getScoreBadge(lead.score)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(lead.riskLevel)}
                      </TableCell>
                      <TableCell className="text-center">
                        {lead.completedSessions}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(lead.lastActivity)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-48">
                          {lead.recommendations.slice(0, 2).map((rec: string, i: number) => (
                            <div key={i} className="truncate text-muted-foreground">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>
                  Distribution of lead scores across ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scoreRange" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value, 'Leads']} />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>
                  Lead distribution by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.categoryBreakdown.map((entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Average scores and conversion rates by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="w-12 justify-center">
                          {category.category}
                        </Badge>
                        <div>
                          <div className="font-medium">{category.count} leads</div>
                          <div className="text-sm text-muted-foreground">
                            Avg Score: {category.avgScore}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{category.conversionRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Conversion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Percentiles</CardTitle>
                <CardDescription>
                  Score distribution percentages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.scoreDistribution.map((range) => (
                    <div key={range.scoreRange} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Score {range.scoreRange}</span>
                        <span>{range.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={range.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scoring Factor Analysis</CardTitle>
                <CardDescription>
                  Performance across different scoring factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Factor Impact Analysis</CardTitle>
                <CardDescription>
                  Weight and performance of each scoring factor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.factorAnalysis).map(([key, value]) => {
                    return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              value.impact === 'high' ? 'border-red-500 text-red-700' :
                              value.impact === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-green-500 text-green-700'
                            }
                          >
                            {value.impact} impact
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">
                            Weight: {(value.weight * 100).toFixed(0)}%
                          </span>
                          <span className="text-sm font-medium">
                            Avg: {value.avg.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={value.avg} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-8">
                          {value.avg.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )})}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Improvement Opportunities</CardTitle>
                <CardDescription>
                  Key areas to focus on for better lead quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.insights.improvementOpportunities.map((opportunity, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          opportunity.impact === 'High' ? 'bg-red-100' :
                          opportunity.impact === 'Medium' ? 'bg-yellow-100' :
                          'bg-green-100'
                        }`}>
                          {opportunity.impact === 'High' ? (
                            <ArrowUp className="h-4 w-4 text-red-600" />
                          ) : opportunity.impact === 'Medium' ? (
                            <TrendingUp className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{opportunity.factor}</h4>
                            <Badge
                              variant="outline"
                              className={
                                opportunity.impact === 'High' ? 'border-red-500 text-red-700' :
                                opportunity.impact === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                                'border-green-500 text-green-700'
                              }
                            >
                              {opportunity.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {opportunity.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scoring Statistics</CardTitle>
                <CardDescription>
                  Key metrics about your lead scoring performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{data.insights.avgScore}</div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.insights.highValueLeads}</div>
                      <div className="text-xs text-muted-foreground">High Value</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{data.insights.atRiskLeads}</div>
                      <div className="text-xs text-muted-foreground">At Risk</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Score Distribution Quality</span>
                      <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your leads show good score distribution across categories
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Model Performance</span>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scoring model is performing well with good factor correlation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}