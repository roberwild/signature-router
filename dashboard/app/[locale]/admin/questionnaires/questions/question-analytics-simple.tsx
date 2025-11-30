'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
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
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionAnalyticsData } from '~/data/admin/questionnaires/get-question-analytics';

interface QuestionAnalyticsProps {
  initialData: QuestionAnalyticsData;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function QuestionAnalytics({ initialData }: QuestionAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'response_rate' | 'avg_time'>('popularity');

  const { data, error, isLoading: _isLoading, mutate } = useSWR(
    `/api/admin/analytics/questions?timeframe=${timeframe}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 60000,
    }
  );

  const handleRefresh = async () => {
    toast.promise(mutate(), {
      loading: 'Refreshing analytics data...',
      success: 'Analytics data refreshed',
      error: 'Failed to refresh data',
    });
  };

  const handleExport = () => {
    const csvData = data.questions.map((q: QuestionAnalyticsData['questions'][0]) => ({
      'Question ID': q.questionId,
      'Question Text': q.questionText,
      'Category': q.category,
      'Response Rate': `${(q.responseRate * 100).toFixed(1)}%`,
      'Avg Response Time': `${q.avgResponseTime.toFixed(1)}s`,
      'Skip Rate': `${(q.skipRate * 100).toFixed(1)}%`,
      'Total Views': q.totalViews,
      'Total Responses': q.totalResponses,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: Record<string, string | number>) => Object.values(row).map((v: string | number) => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-analytics-${timeframe}.csv`;
    a.click();

    toast.success('Data exported successfully');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <AlertTitle className="ml-6 mt-1">Error</AlertTitle>
          <AlertDescription className="mt-1">
            Failed to load question analytics data. Please try again.
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  if (!data) {
    return <div>Loading...</div>;
  }

  const sortedQuestions = [...data.questions].sort((a, b) => {
    switch(sortBy) {
      case 'response_rate':
        return b.responseRate - a.responseRate;
      case 'avg_time':
        return b.avgResponseTime - a.avgResponseTime;
      default:
        return b.totalViews - a.totalViews;
    }
  });

  const selectedQuestionData = selectedQuestion
    ? data.questions.find((q: QuestionAnalyticsData['questions'][0]) => q.questionId === selectedQuestion)
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'popularity' | 'response_rate' | 'avg_time')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="response_rate">Response Rate</SelectItem>
              <SelectItem value="avg_time">Avg Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
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
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              Automated analysis of question performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.slice(0, 5).map((insight: QuestionAnalyticsData['insights'][0], index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  {insight.type === 'high_performer' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {insight.type === 'low_response' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {insight.type === 'high_skip' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                  {insight.type === 'slow_completion' && <Clock className="h-4 w-4 text-blue-600 mt-0.5" />}
                  <span className="text-sm">{insight.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Question Performance Details</CardTitle>
          <CardDescription>
            Detailed metrics for all questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Response Rate</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Responses</TableHead>
                <TableHead className="text-right">Skip Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedQuestions.map((question: QuestionAnalyticsData['questions'][0]) => (
                <TableRow
                  key={question.questionId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedQuestion(question.questionId)}
                >
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {question.questionText}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      question.responseRate > 0.8 ? 'text-green-600' :
                      question.responseRate < 0.5 ? 'text-red-600' : ''
                    }`}>
                      {(question.responseRate * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {question.avgResponseTime.toFixed(1)}s
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {question.totalViews}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      {question.totalResponses}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`${
                      question.skipRate > 0.3 ? 'text-yellow-600' : ''
                    }`}>
                      {(question.skipRate * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Selected Question Details */}
      {selectedQuestionData && (
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>
              {selectedQuestionData.questionText}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-xl font-bold">
                    {(selectedQuestionData.responseRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-xl font-bold">
                    {selectedQuestionData.avgResponseTime.toFixed(1)}s
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-xl font-bold">
                    {selectedQuestionData.totalViews}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                  <p className="text-xl font-bold">
                    {selectedQuestionData.totalResponses}
                  </p>
                </div>
              </div>

              {/* Category Performance */}
              {selectedQuestionData.categoryPerformance.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Performance by Category</h4>
                  <div className="space-y-2">
                    {selectedQuestionData.categoryPerformance.map((cat: QuestionAnalyticsData['questions'][0]['categoryPerformance'][0]) => (
                      <div key={cat.category} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="font-medium">{cat.category}</span>
                        <div className="flex gap-4">
                          <span className="text-sm">
                            Response: {(cat.responseRate * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm">
                            Avg Time: {cat.avgTime.toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}