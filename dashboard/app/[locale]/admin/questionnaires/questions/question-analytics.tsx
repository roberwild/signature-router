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
  HelpCircle,
  Clock,
  Activity,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionAnalyticsData } from '~/data/admin/questionnaires/get-question-analytics';

interface QuestionAnalyticsProps {
  initialData: QuestionAnalyticsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function QuestionAnalytics({ initialData }: QuestionAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'response_rate' | 'avg_time'>('popularity');

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/analytics/questions?timeframe=${timeframe}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 60000,
    }
  );

  const handleRefresh = () => {
    mutate();
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    const csvData = data.questions.map((q: QuestionAnalyticsData['questions'][0]) => ({
      question: q.questionText.replace(/,/g, ';'),
      category: q.category,
      totalViews: q.totalViews,
      responseRate: q.responseRate.toFixed(2),
      skipRate: q.skipRate.toFixed(2),
      avgResponseTime: q.avgResponseTime.toFixed(0)
    }));

    const csv = [
      ['Question', 'Category', 'Views', 'Response Rate (%)', 'Skip Rate (%)', 'Avg Time (s)'],
      ...csvData.map((row: Record<string, string | number>) => Object.values(row))
    ].map((row: (string | number)[]) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-analytics-${timeframe}.csv`;
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
            Failed to load question analytics data. Please try again.
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

  const sortedQuestions = [...data.questions].sort((a, b) => {
    switch (sortBy) {
      case 'response_rate':
        return b.responseRate - a.responseRate;
      case 'avg_time':
        return a.avgResponseTime - b.avgResponseTime;
      case 'popularity':
      default:
        return b.totalViews - a.totalViews;
    }
  });

  const selectedQuestionData = selectedQuestion
    ? data.questions.find((q: QuestionAnalyticsData['questions'][0]) => q.questionId === selectedQuestion)
    : null;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'high_skip': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'slow_response': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'category_outlier': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'trending_down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

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

          <Select value={sortBy} onValueChange={(value: 'popularity' | 'response_rate' | 'avg_time') => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="response_rate">Response Rate</SelectItem>
              <SelectItem value="avg_time">Response Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedQuestion || "all"} onValueChange={(value) => setSelectedQuestion(value === "all" ? null : value)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select question" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Questions</SelectItem>
              {data.questions.slice(0, 20).map((q: QuestionAnalyticsData['questions'][0]) => (
                <SelectItem key={q.questionId} value={q.questionId}>
                  {q.questionText.length > 50 ? `${q.questionText.substring(0, 50)}...` : q.questionText}
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
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overallStats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.overallStats.avgResponseRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performing</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate" title={data.topPerformers[0]?.questionText || 'N/A'}>
              {data.topPerformers[0]?.questionText ? 
                (data.topPerformers[0].questionText.length > 30 
                  ? `${data.topPerformers[0].questionText.substring(0, 30)}...`
                  : data.topPerformers[0].questionText)
                : 'No data yet'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold truncate" title={data.needsAttention[0]?.questionText || 'N/A'}>
              {data.needsAttention[0]?.questionText ? 
                (data.needsAttention[0].questionText.length > 30 
                  ? `${data.needsAttention[0].questionText.substring(0, 30)}...`
                  : data.needsAttention[0].questionText)
                : 'No issues found'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Key Insights
            </CardTitle>
            <CardDescription>
              Issues and opportunities identified in question performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.slice(0, 5).map((insight: QuestionAnalyticsData['insights'][0], index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="font-medium truncate" title={insight.description}>
                      {insight.description.length > 60
                        ? `${insight.description.substring(0, 60)}...`
                        : insight.description
                      }
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Question ID: {insight.questionId}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {insight.metric.toFixed(1)}{insight.type === 'slow_completion' ? 's' : '%'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="responses">Response Types</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Top Questions by Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedQuestions.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="questionText" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Response Rate']}
                      labelFormatter={(label) => `Question: ${label}`}
                    />
                    <Bar dataKey="responseRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skip Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Questions with High Skip Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedQuestions.sort((a, b) => b.skipRate - a.skipRate).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="questionText" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Skip Rate']}
                      labelFormatter={(label) => `Question: ${label}`}
                    />
                    <Bar dataKey="skipRate" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {selectedQuestionData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Over Time</CardTitle>
                  <CardDescription>{selectedQuestionData.questionText}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selectedQuestionData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="rate" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedQuestionData.performanceByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Response Rate']} />
                      <Bar dataKey="responseRate" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedQuestions.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="questionText" 
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${Math.round(value)}s`, 'Avg Response Time']}
                    labelFormatter={(label) => `Question: ${label}`}
                  />
                  <Bar dataKey="avgResponseTime" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          {selectedQuestionData && (
            <Card>
              <CardHeader>
                <CardTitle>Response Types Distribution</CardTitle>
                <CardDescription>{selectedQuestionData.questionText}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={selectedQuestionData.responseTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {selectedQuestionData.responseTypes.map((entry: QuestionAnalyticsData['questions'][0]['responseTypes'][0], index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Response Rate</TableHead>
                    <TableHead className="text-right">Skip Rate</TableHead>
                    <TableHead className="text-right">Avg Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuestions.slice(0, 20).map((question: QuestionAnalyticsData['questions'][0]) => (
                    <TableRow key={question.questionId}>
                      <TableCell className="font-medium">
                        <div className="max-w-md">
                          <div className="truncate" title={question.questionText}>
                            {question.questionText.length > 60
                              ? `${question.questionText.substring(0, 60)}...`
                              : question.questionText
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{question.category}</TableCell>
                      <TableCell className="text-right">{question.totalViews}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={question.responseRate > 0.7 ? 'default' : question.responseRate > 0.4 ? 'secondary' : 'destructive'}>
                          {(question.responseRate * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{(question.skipRate * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{Math.round(question.avgResponseTime)}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}