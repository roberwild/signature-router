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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MemoryStick
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '~/hooks/use-translations';
import type { SystemPerformanceData } from '~/data/admin/get-system-performance';

interface PerformanceMonitoringProps {
  initialData: SystemPerformanceData;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PerformanceMonitoring({ initialData }: PerformanceMonitoringProps) {
  const { t } = useTranslations('admin/performance');
  const [timeframe, setTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/performance?timeframe=${timeframe}`,
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: autoRefresh ? 30000 : 0, // Refresh every 30 seconds if auto-refresh is on
    }
  );

  const handleRefresh = () => {
    mutate();
    toast.success(t('messages.refreshSuccess'));
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />{t('healthStatus.healthy')}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="mr-1 h-3 w-3" />{t('healthStatus.warning')}</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="mr-1 h-3 w-3" />{t('healthStatus.critical')}</Badge>;
      default:
        return <Badge variant="secondary">{t('healthStatus.unknown')}</Badge>;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">{t('messages.errorLoading')}</CardTitle>
          <CardDescription>
            {t('messages.errorDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('messages.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('controls.timeframe')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t('timeframes.1h')}</SelectItem>
              <SelectItem value="24h">{t('timeframes.24h')}</SelectItem>
              <SelectItem value="7d">{t('timeframes.7d')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className="mr-2 h-4 w-4" />
            {t('controls.autoRefresh')}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('controls.refresh')}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.systemHealth')}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getHealthBadge(data.currentMetrics.systemHealth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.activeUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">{t('indicators.lastFiveMinutes')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.totalSessions')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMetrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">{t('indicators.last24h')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.avgResponseTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.currentMetrics.avgResponseTime)}s</div>
            <p className="text-xs text-muted-foreground">
              {data.currentMetrics.avgResponseTime > 300 ? (
                <span className="text-red-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />{t('indicators.aboveThreshold')}
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="mr-1 h-3 w-3" />{t('indicators.normal')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('metrics.errorRate')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMetrics.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.currentMetrics.errorRate > 20 ? (
                <span className="text-red-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />{t('indicators.high')}
                </span>
              ) : (
                <span className="text-green-600 flex items-center">
                  <TrendingDown className="mr-1 h-3 w-3" />{t('indicators.low')}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Active Alerts ({data.alerts.length})
            </CardTitle>
            <CardDescription>
              System alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.map((alert: { id: string; title: string; description: string; severity: string; timestamp: string; value: number; threshold: number; type: string }) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getAlertSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {alert.value.toFixed(1)}{alert.type === 'response_time' ? 's' : '%'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: {alert.threshold}{alert.type === 'response_time' ? 's' : '%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('resources.cpuUsage')}</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{data.resourceUsage.cpuUsage.toFixed(1)}%</div>
            <Progress value={data.resourceUsage.cpuUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('resources.memoryUsage')}</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{data.resourceUsage.memoryUsage.toFixed(1)}%</div>
            <Progress value={data.resourceUsage.memoryUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('resources.diskUsage')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{data.resourceUsage.diskUsage.toFixed(1)}%</div>
            <Progress value={data.resourceUsage.diskUsage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('resources.networkIO')}</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.resourceUsage.networkIO.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">{t('units.megabytesPerSecond')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
          <TabsTrigger value="endpoints">{t('tabs.endpoints')}</TabsTrigger>
          <TabsTrigger value="errors">{t('tabs.errors')}</TabsTrigger>
          <TabsTrigger value="resources">{t('tabs.resources')}</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.responseTimeTrend.title')}</CardTitle>
                <CardDescription>{t('charts.responseTimeTrend.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [`${value.toFixed(1)}s`, 'Response Time']}
                    />
                    <Line type="monotone" dataKey="avgResponseTime" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.errorRateTrend.title')}</CardTitle>
                <CardDescription>{t('charts.errorRateTrend.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Error Rate']}
                    />
                    <Area type="monotone" dataKey="errorRate" stroke="#ff8042" fill="#ff8042" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.activeUsers.title')}</CardTitle>
                <CardDescription>{t('charts.activeUsers.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [value, 'Active Users']}
                    />
                    <Area type="monotone" dataKey="activeUsers" stroke="#00C49F" fill="#00C49F" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.sessionsPerMinute.title')}</CardTitle>
                <CardDescription>{t('charts.sessionsPerMinute.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [value, 'Sessions/min']}
                    />
                    <Bar dataKey="sessionsPerMinute" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('endpoints.title')}</CardTitle>
              <CardDescription>{t('endpoints.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('endpoints.table.endpoint')}</TableHead>
                    <TableHead className="text-right">{t('endpoints.table.requests')}</TableHead>
                    <TableHead className="text-right">{t('endpoints.table.avgResponseTime')}</TableHead>
                    <TableHead className="text-right">{t('endpoints.table.errorRate')}</TableHead>
                    <TableHead className="text-right">{t('endpoints.table.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topEndpoints.map((endpoint: { endpoint: string; requests: number; avgResponseTime: number; errorRate: number }, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{endpoint.endpoint}</TableCell>
                      <TableCell className="text-right">{endpoint.requests.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(endpoint.avgResponseTime)}ms</TableCell>
                      <TableCell className="text-right">{endpoint.errorRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        {endpoint.errorRate > 10 ? (
                          <Badge variant="destructive">{t('endpoints.status.issues')}</Badge>
                        ) : endpoint.avgResponseTime > 1000 ? (
                          <Badge variant="secondary">{t('endpoints.status.slow')}</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">{t('endpoints.status.healthy')}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('errors.title')}</CardTitle>
              <CardDescription>{t('errors.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p className="text-muted-foreground">{t('errors.noErrors')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentErrors.map((error: { timestamp: string; error: string; count: number; endpoint?: string }, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-red-600">{error.error}</div>
                          {error.endpoint && (
                            <div className="text-sm text-muted-foreground font-mono mt-1">
                              {error.endpoint}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {formatTimestamp(error.timestamp)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {error.count} {error.count > 1 ? t('errors.occurrencesPlural') : t('errors.occurrences')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('charts.cpuUsageOverTime.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [`${value?.toFixed(1)}%`, 'CPU Usage']}
                    />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('charts.memoryUsageOverTime.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => formatTimestamp(value)}
                      formatter={(value: number) => [`${value?.toFixed(1)}%`, 'Memory Usage']}
                    />
                    <Line type="monotone" dataKey="memoryUsage" stroke="#00C49F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}