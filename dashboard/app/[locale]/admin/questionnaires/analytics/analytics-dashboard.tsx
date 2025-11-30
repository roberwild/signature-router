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
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AnalyticsData } from '~/data/admin/questionnaires/get-analytics-data';

interface AnalyticsDashboardProps {
  initialData: AnalyticsData;
  locale: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const severityColors = {
  low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  medium: 'bg-orange-50 border-orange-200 text-orange-800',
  high: 'bg-red-50 border-red-200 text-red-800'
};

export function AnalyticsDashboard({ initialData, locale: _locale }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 5 minutes
  const { data: analyticsData, error: _error, mutate } = useSWR<{data: AnalyticsData}>(
    `/api/admin/questionnaires/analytics?range=${timeRange}`,
    fetcher,
    {
      fallbackData: { data: initialData },
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: true
    }
  );

  const data = analyticsData?.data || initialData;

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setTimeout(() => setRefreshing(false), 500);
    toast.success('Analytics data refreshed');
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/questionnaires/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange, format: 'csv' })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questionnaire-analytics-${timeRange}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v: '24h' | '7d' | '30d') => setTimeRange(v)}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="text-muted-foreground">
            Auto-refresh: 5min
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Anomaly Alerts */}
      {data.anomalies.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle className="ml-6 mt-1">
              {data.anomalies.length} Anomal{data.anomalies.length === 1 ? 'y' : 'ies'} Detected
            </AlertTitle>
            <AlertDescription className="mt-1">
              {data.anomalies[0].description}
              {data.anomalies.length > 1 && ` (+${data.anomalies.length - 1} more)`}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.totalSessions} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.averageResponseTime}m</div>
            <p className="text-xs text-muted-foreground">
              Per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.abandonmentRate}%</div>
            <p className="text-xs text-muted-foreground">
              Sessions abandoned
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Completion Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>24h, 7d, 30d view</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Response Rate Trend</CardTitle>
                <CardDescription>Questions answered over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.responseTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Abandonment Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Abandonment Rate Analysis</CardTitle>
              <CardDescription>Track session abandonment patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.trends.abandonmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Category</CardTitle>
                <CardDescription>A1/B1/C1/D1 breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Response Distribution</CardTitle>
                <CardDescription>Total responses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="responses"
                      nameKey="category"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Responses</th>
                      <th className="text-right p-2">Completions</th>
                      <th className="text-right p-2">Conversion Rate</th>
                      <th className="text-right p-2">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryBreakdown.map((category) => (
                      <tr key={category.category} className="border-b">
                        <td className="p-2">
                          <Badge variant="outline">{category.category}</Badge>
                        </td>
                        <td className="text-right p-2">{category.responses}</td>
                        <td className="text-right p-2">{category.completions}</td>
                        <td className="text-right p-2">{category.conversionRate}%</td>
                        <td className="text-right p-2">{category.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Questions</CardTitle>
              <CardDescription>Response rates and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topQuestions.map((question, index) => (
                  <div key={question.questionId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{question.questionText}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {question.questionId}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{question.responseRate}%</div>
                        <div className="text-muted-foreground">Response</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{question.avgResponseTime}m</div>
                        <div className="text-muted-foreground">Avg Time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{question.skipRate}%</div>
                        <div className="text-muted-foreground">Skip Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                Automated detection of unusual patterns in questionnaire performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No anomalies detected</p>
                  <p className="text-xs mt-1">System is performing normally</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.anomalies.map((anomaly) => (
                    <Alert key={anomaly.id} className={severityColors[anomaly.severity]}>
                      <AlertTriangle className="h-4 w-4" />
                      <div>
                        <AlertTitle className="ml-6 mt-1 capitalize">
                          {anomaly.type.replace('_', ' ')} - {anomaly.severity} Priority
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {anomaly.description}
                          <div className="text-xs mt-2 opacity-75">
                            Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}