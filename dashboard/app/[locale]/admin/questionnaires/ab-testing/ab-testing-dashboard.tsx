'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
// import { Progress } from '@workspace/ui/components/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  // LineChart,
  // Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Plus,
  Play,
  Pause,
  // RotateCcw,
  TrendingUp,
  Users,
  Activity,
  Target,
  RefreshCw,
  Eye,
  CheckCircle,
  // XCircle,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { ABExperimentsData, ABExperiment } from '~/data/admin/get-ab-experiments';

interface ABTestingDashboardProps {
  initialData: ABExperimentsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ABTestingDashboard({ initialData }: ABTestingDashboardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    successMetric: 'completion_rate',
    trafficSplit: 50,
    minimumSampleSize: 100,
  });

  const { data, error, isLoading: _isLoading, mutate } = useSWR(
    '/api/admin/ab-experiments',
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 60000,
    }
  );

  const handleCreateExperiment = async () => {
    try {
      const response = await fetch('/api/admin/ab-experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExperiment),
      });

      if (!response.ok) {
        throw new Error('Failed to create experiment');
      }

      setIsCreateOpen(false);
      setNewExperiment({
        name: '',
        description: '',
        successMetric: 'completion_rate',
        trafficSplit: 50,
        minimumSampleSize: 100,
      });
      
      mutate();
      toast.success('Experiment created successfully');
    } catch (_error) {
      toast.error('Failed to create experiment');
    }
  };

  const handleStartExperiment = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/admin/ab-experiments/${experimentId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start experiment');
      }

      mutate();
      toast.success('Experiment started');
    } catch (_error) {
      toast.error('Failed to start experiment');
    }
  };

  const handleStopExperiment = async (experimentId: string) => {
    try {
      const response = await fetch(`/api/admin/ab-experiments/${experimentId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to stop experiment');
      }

      mutate();
      toast.success('Experiment stopped');
    } catch (_error) {
      toast.error('Failed to stop experiment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><Play className="mr-1 h-3 w-3" />Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800"><Pause className="mr-1 h-3 w-3" />Paused</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Draft</Badge>;
    }
  };

  const selectedExperimentData = selectedExperiment
    ? data.experiments.find((e: ABExperiment) => e.id === selectedExperiment)
    : null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Experiments</CardTitle>
          <CardDescription>
            Failed to load A/B testing data. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => mutate()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">A/B Testing Experiments</h2>
          <p className="text-muted-foreground">
            Optimize your questionnaires with data-driven testing
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new experiment to test questionnaire variations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Experiment Name</Label>
                <Input
                  id="name"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  placeholder="e.g., Question Order Test"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  placeholder="Describe what you're testing..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="metric">Success Metric</Label>
                  <Select
                    value={newExperiment.successMetric}
                    onValueChange={(value) => setNewExperiment({ ...newExperiment, successMetric: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completion_rate">Completion Rate</SelectItem>
                      <SelectItem value="lead_quality">Lead Quality</SelectItem>
                      <SelectItem value="response_time">Response Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="traffic">Traffic Split (%)</Label>
                  <Input
                    id="traffic"
                    type="number"
                    min="10"
                    max="90"
                    value={newExperiment.trafficSplit}
                    onChange={(e) => setNewExperiment({ ...newExperiment, trafficSplit: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sample">Minimum Sample Size</Label>
                <Input
                  id="sample"
                  type="number"
                  min="50"
                  value={newExperiment.minimumSampleSize}
                  onChange={(e) => setNewExperiment({ ...newExperiment, minimumSampleSize: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExperiment} disabled={!newExperiment.name}>
                Create Experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalExperiments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeExperiments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.completedExperiments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalParticipants.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="experiments">All Experiments</TabsTrigger>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiments</CardTitle>
              <CardDescription>
                Manage your A/B testing experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Metric</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Variants</TableHead>
                    <TableHead className="text-right">Winner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.experiments.map((experiment: ABExperiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{experiment.name}</div>
                          {experiment.description && (
                            <div className="text-sm text-muted-foreground">
                              {experiment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(experiment.status)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {experiment.successMetric.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        {experiment.totalParticipants}
                      </TableCell>
                      <TableCell className="text-right">
                        {experiment.variants.length}
                      </TableCell>
                      <TableCell className="text-right">
                        {experiment.winner ? (
                          <Badge variant={experiment.isSignificant ? 'default' : 'secondary'}>
                            {experiment.winner}
                            {experiment.isSignificant && <Award className="ml-1 h-3 w-3" />}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExperiment(experiment.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {experiment.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartExperiment(experiment.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          {experiment.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStopExperiment(experiment.id)}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {selectedExperimentData ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedExperimentData.name} - Results</CardTitle>
                  <CardDescription>
                    Detailed analysis of experiment performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium mb-4">Conversion Rates</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={selectedExperimentData.variants}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Conversion Rate']} />
                          <Bar dataKey="conversionRate" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-4">Sample Sizes</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={selectedExperimentData.variants}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="sampleSize"
                          >
                            {selectedExperimentData.variants.map((entry: typeof selectedExperimentData.variants[0], index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-4">Variant Details</h4>
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead className="text-right">Sample Size</TableHead>
                          <TableHead className="text-right">Conversion Rate</TableHead>
                          <TableHead className="text-right">Avg Response Time</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExperimentData.variants.map((variant: typeof selectedExperimentData.variants[0]) => (
                          <TableRow key={variant.id}>
                            <TableCell className="font-medium">
                              {variant.name}
                              {variant.isControl && (
                                <Badge variant="outline" className="ml-2">Control</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{variant.sampleSize}</TableCell>
                            <TableCell className="text-right">
                              {(variant.conversionRate * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {Math.round(variant.avgResponseTime)}s
                            </TableCell>
                            <TableCell className="text-right">
                              {variant.name === selectedExperimentData.winner ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <TrendingUp className="mr-1 h-3 w-3" />
                                  Winner
                                </Badge>
                              ) : (
                                <Badge variant="outline">Variant</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select an experiment to view results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  Important findings from your A/B tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.experiments
                    .filter((e: ABExperiment) => e.isSignificant && e.winner)
                    .map((experiment: ABExperiment) => (
                      <div key={experiment.id} className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-medium">{experiment.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Winner: <span className="font-medium">{experiment.winner}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {experiment.totalParticipants} participants
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {data.experiments.filter((e: ABExperiment) => e.isSignificant).length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No significant results yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Run more experiments to gather insights
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggested next steps based on your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.experiments.filter((e: ABExperiment) => e.status === 'active').length === 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Start New Experiments</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            You have no active experiments. Consider testing question order, timing, or content variations.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {data.experiments.some((e: ABExperiment) => e.totalParticipants < 100) && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Increase Sample Sizes</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Some experiments have low participation. Consider running longer or promoting more widely.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Monitor Active Tests</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Check your active experiments regularly for statistical significance.
                        </div>
                      </div>
                    </div>
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