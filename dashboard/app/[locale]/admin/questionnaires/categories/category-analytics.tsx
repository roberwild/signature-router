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
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryAnalyticsData } from '~/data/admin/questionnaires/get-category-analytics';

interface CategoryAnalyticsProps {
  initialData: CategoryAnalyticsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CategoryAnalytics({ initialData }: CategoryAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/analytics/categories?timeframe=${timeframe}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  const handleRefresh = () => {
    mutate();
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    // Export functionality
    const csvData = data.categories.map((cat: { category: string; totalLeads: number; completionRate: number; avgSessionDuration: number; avgQuestionsAnswered: number; bounceRate: number }) => ({
      category: cat.category,
      totalLeads: cat.totalLeads,
      completionRate: cat.completionRate.toFixed(2),
      avgSessionDuration: cat.avgSessionDuration.toFixed(0),
      avgQuestionsAnswered: cat.avgQuestionsAnswered.toFixed(1),
      bounceRate: cat.bounceRate.toFixed(2)
    }));

    const csv = [
      ['Category', 'Total Leads', 'Completion Rate (%)', 'Avg Duration (s)', 'Avg Questions', 'Bounce Rate (%)'],
      ...csvData.map((row: Record<string, unknown>) => Object.values(row))
    ].map((row: unknown[]) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `category-analytics-${timeframe}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Analytics exported successfully');
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
          <CardDescription>
            Failed to load category analytics data. Please try again.
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

  const selectedCategoryData = selectedCategory
    ? data.categories.find((cat: { category: string }) => cat.category === selectedCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {data.categories.map((cat: { category: string }) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.overallCompletionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{data.summary.bestPerformingCategory}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{data.summary.worstPerformingCategory}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Rates by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion Rate']} />
                    <Bar dataKey="completionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalLeads"
                    >
                      {data.categories.map((entry: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Total Leads']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {selectedCategoryData && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time - {selectedCategoryData.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={selectedCategoryData.performanceByTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="rate" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${Math.round(value)}s`, 'Avg Duration']} />
                    <Bar dataKey="avgSessionDuration" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions Answered</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [value.toFixed(1), 'Avg Questions']} />
                    <Bar dataKey="avgQuestionsAnswered" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance Trends</CardTitle>
              <CardDescription>
                Comparison with previous period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.comparisons.map((comparison: { category: string; completionTrend: 'up' | 'down' | 'stable'; trendPercentage: number }) => (
                  <div key={comparison.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        {comparison.completionTrend === 'up' && (
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        )}
                        {comparison.completionTrend === 'down' && (
                          <ArrowDown className="h-4 w-4 text-red-600" />
                        )}
                        {comparison.completionTrend === 'stable' && (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{comparison.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {comparison.completionTrend === 'up' && 'Improving'}
                          {comparison.completionTrend === 'down' && 'Declining'}
                          {comparison.completionTrend === 'stable' && 'Stable'}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        comparison.completionTrend === 'up' ? 'default' : 
                        comparison.completionTrend === 'down' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {comparison.trendPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total Leads</TableHead>
                    <TableHead className="text-right">Completion Rate</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                    <TableHead className="text-right">Avg Questions</TableHead>
                    <TableHead className="text-right">Bounce Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categories.map((category: { category: string; totalLeads: number; completionRate: number; avgSessionDuration: number; avgQuestionsAnswered: number; bounceRate: number }) => (
                    <TableRow key={category.category}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell className="text-right">{category.totalLeads}</TableCell>
                      <TableCell className="text-right">{category.completionRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{Math.round(category.avgSessionDuration)}s</TableCell>
                      <TableCell className="text-right">{category.avgQuestionsAnswered.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{category.bounceRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}