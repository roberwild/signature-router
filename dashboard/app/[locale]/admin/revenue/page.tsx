'use client';

import { use } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, CreditCard, Calendar } from 'lucide-react';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { AdminPageTitle } from '../components/admin-page-title';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AdminRevenuePageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    period?: string;
  }>;
}

// Mock data for revenue charts
const monthlyRevenue = [
  { month: 'Jan', revenue: 45000, subscriptions: 32000, services: 13000 },
  { month: 'Feb', revenue: 52000, subscriptions: 35000, services: 17000 },
  { month: 'Mar', revenue: 48000, subscriptions: 33000, services: 15000 },
  { month: 'Apr', revenue: 61000, subscriptions: 40000, services: 21000 },
  { month: 'May', revenue: 58000, subscriptions: 39000, services: 19000 },
  { month: 'Jun', revenue: 65000, subscriptions: 42000, services: 23000 },
  { month: 'Jul', revenue: 72000, subscriptions: 45000, services: 27000 },
  { month: 'Aug', revenue: 68000, subscriptions: 43000, services: 25000 },
  { month: 'Sep', revenue: 75000, subscriptions: 47000, services: 28000 },
  { month: 'Oct', revenue: 82000, subscriptions: 50000, services: 32000 },
  { month: 'Nov', revenue: 79000, subscriptions: 48000, services: 31000 },
  { month: 'Dec', revenue: 85000, subscriptions: 52000, services: 33000 },
];

const revenueByPlan = [
  { name: 'Basic', value: 125000, color: '#3b82f6' },
  { name: 'Professional', value: 280000, color: '#10b981' },
  { name: 'Enterprise', value: 385000, color: '#8b5cf6' },
];

const topCustomers = [
  { name: 'Tech Corp International', revenue: 45000, plan: 'Enterprise', status: 'active' },
  { name: 'Global Solutions Inc', revenue: 38000, plan: 'Enterprise', status: 'active' },
  { name: 'Digital Innovations', revenue: 32000, plan: 'Professional', status: 'active' },
  { name: 'Future Systems Ltd', revenue: 28000, plan: 'Professional', status: 'active' },
  { name: 'Smart Industries', revenue: 25000, plan: 'Enterprise', status: 'churned' },
];

const growthMetrics = [
  { metric: 'MRR', current: 85000, previous: 72000, growth: 18.1 },
  { metric: 'ARR', current: 1020000, previous: 864000, growth: 18.1 },
  { metric: 'ARPU', current: 850, previous: 720, growth: 18.1 },
  { metric: 'LTV', current: 25500, previous: 21600, growth: 18.1 },
];

export default function AdminRevenuePage({ params: _params, searchParams }: AdminRevenuePageProps) {
  // Note: Authentication and admin checks should be handled in middleware or a wrapper component
  const resolvedSearchParams = use(searchParams);
  const period = resolvedSearchParams?.period || '12m';
  
  // Calculate summary metrics
  const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
  const _avgMonthlyRevenue = totalRevenue / monthlyRevenue.length;
  const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue;
  const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2].revenue;
  const monthlyGrowth = ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  
  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <AdminPageTitle 
              title="Revenue Analytics" 
              info="Track platform revenue and financial metrics"
            />
          </div>
        </PagePrimaryBar>
        <PageActions>
          <Select defaultValue={period}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="3m">3 months</SelectItem>
              <SelectItem value="6m">6 months</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </PageActions>
      </PageHeader>
      
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}k</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +18.1% from last year
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(lastMonthRevenue / 1000).toFixed(0)}k</div>
                <p className="text-xs text-muted-foreground">
                  <span className={monthlyGrowth > 0 ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}>
                    {monthlyGrowth > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                    {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +12% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Revenue/User</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$850</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +5.2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue breakdown by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Subscriptions" />
                  <Area type="monotone" dataKey="services" stackId="1" stroke="#10b981" fill="#10b981" name="Services" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Plan and Top Customers */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Distribution across subscription tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByPlan}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {revenueByPlan.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: plan.color }} />
                        <span className="text-sm">{plan.name}</span>
                      </div>
                      <span className="text-sm font-medium">${(plan.value / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest revenue generating accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{customer.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {customer.plan}
                          </Badge>
                          {customer.status === 'churned' && (
                            <Badge variant="destructive" className="text-xs">
                              Churned
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${(customer.revenue / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-muted-foreground">per year</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
              <CardDescription>Key performance indicators and growth rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {growthMetrics.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <p className="text-sm text-muted-foreground">{metric.metric}</p>
                    <p className="text-2xl font-bold">
                      ${metric.current >= 1000 ? `${(metric.current / 1000).toFixed(0)}k` : metric.current}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={metric.growth > 0 ? "default" : "destructive"} className="text-xs">
                        {metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        vs ${metric.previous >= 1000 ? `${(metric.previous / 1000).toFixed(0)}k` : metric.previous}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alert for demo */}
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <div>
              <AlertTitle className="ml-6 mt-1">Work in Progress</AlertTitle>
              <AlertDescription className="mt-1">
                This revenue dashboard is currently showing mock data. Integration with real payment and subscription data is pending.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </PageBody>
    </Page>
  );
}