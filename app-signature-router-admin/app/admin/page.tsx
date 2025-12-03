'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  Users,
  FileText,
  Settings,
  BarChart3,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/admin/metric-card';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import type { DashboardMetrics } from '@/lib/api/types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981'];

export default function AdminDashboardPage() {
  const { apiClient, isLoading: sessionLoading, isAuthenticated, redirectToLogin } = useApiClientWithStatus({ autoRedirect: true });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    if (!isAuthenticated) {
      console.log('⏳ Waiting for authentication before fetching metrics...');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardMetrics();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Error al cargar métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchMetrics, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Transform data for charts
  const channelPieData = metrics?.byChannel 
    ? Object.entries(metrics.byChannel).map(([name, data], index) => ({
        name,
        value: data.count,
        color: COLORS[index % COLORS.length],
      }))
    : [];

  const hourlyChartData = metrics?.hourlyData?.map(item => ({
    hour: item.hour,
    firmas: item.total,
    exito: item.successful,
  })) || [];

  const latencyChartData = metrics?.latencyTimeline?.map(item => ({
    time: item.date.substring(5), // MM-DD format
    p50: item.p50 / 1000, // Convert to seconds
    p95: item.p95 / 1000,
    p99: item.p99 / 1000,
  })) || [];

  const channelSuccessData = metrics?.byChannel
    ? Object.entries(metrics.byChannel).map(([channel, data]) => ({
        canal: channel,
        tasa: data.successRate,
        total: data.count,
      }))
    : [];

  // Session loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - autoRedirect should handle this, but show fallback UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Redirigiendo al Login...</h2>
            <p className="text-muted-foreground mb-4">
              Tu sesión ha expirado. Redirigiendo automáticamente...
            </p>
            <Button onClick={redirectToLogin} variant="outline">
              Ir al Login ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-singular-gray dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchMetrics}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <AdminPageTitle
                title="Signature Router Admin"
                info="Gestión y monitoreo del sistema de routing de firmas"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                Actualizado: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMetrics}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        className="mx-auto max-w-7xl space-y-6 p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Main Metrics */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Firmas Totales (24h)"
              value={metrics?.overview.totalSignatures24h.toLocaleString() || '0'}
              description="Total procesadas"
              icon={FileText}
              trend="up"
              trendValue={`${metrics?.overview.totalSignatures7d.toLocaleString() || 0} (7d)`}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Firmas Activas"
              value={metrics?.overview.activeSignatures || 0}
              description="En proceso ahora"
              icon={Activity}
              color="warning"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Tasa de Éxito"
              value={`${metrics?.overview.successRate || 0}%`}
              description="Últimos 30 días"
              icon={CheckCircle2}
              color="success"
              trend="up"
              trendValue={`${metrics?.overview.failedSignatures24h || 0} fallos hoy`}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Latencia Promedio"
              value={`${metrics?.overview.avgLatency || 0}ms`}
              description="Tiempo de respuesta"
              icon={Zap}
              color="primary"
            />
          </motion.div>
        </motion.div>

        {/* Secondary Metrics */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Proveedores Activos"
              value={`${metrics?.overview.activeProviders || 0}/${metrics?.overview.totalProviders || 0}`}
              description="Conectados"
              icon={Activity}
              color={metrics?.overview.activeProviders === metrics?.overview.totalProviders ? 'success' : 'warning'}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Reglas de Routing"
              value={metrics?.overview.routingRulesCount || 0}
              description="Activas"
              icon={Settings}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Circuit Breakers"
              value={metrics?.overview.circuitBreakersOpen || 0}
              description="Abiertos"
              icon={Shield}
              color={(metrics?.overview.circuitBreakersOpen || 0) === 0 ? 'success' : 'error'}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Firmas 30d"
              value={metrics?.overview.totalSignatures30d.toLocaleString() || '0'}
              description="Último mes"
              icon={TrendingUp}
            />
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Channel Distribution - Pie Chart */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Distribución por Canal</CardTitle>
                  <CardDescription>Volumen de firmas por tipo de canal</CardDescription>
                </CardHeader>
                <CardContent>
                  {channelPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={channelPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1000}
                          >
                            {channelPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {channelPieData.map((channel, index) => (
                          <motion.div
                            key={channel.name}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 1 }}
                          >
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: channel.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {channel.name}: <strong>{channel.value.toLocaleString()}</strong>
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Sin datos de canales disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Hourly Traffic */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Tráfico por Hora</CardTitle>
                  <CardDescription>Firmas procesadas vs exitosas en las últimas 24h</CardDescription>
                </CardHeader>
                <CardContent>
                  {hourlyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={hourlyChartData}>
                        <defs>
                          <linearGradient id="colorFirmas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExito" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="hour" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="firmas"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorFirmas)"
                          animationDuration={1500}
                          name="Total"
                        />
                        <Area
                          type="monotone"
                          dataKey="exito"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorExito)"
                          animationDuration={1500}
                          name="Exitosas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Sin datos de tráfico disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Latencia del Sistema</CardTitle>
                  <CardDescription>P50, P95 y P99 en segundos (últimos 7 días)</CardDescription>
                </CardHeader>
                <CardContent>
                  {latencyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={latencyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="p50"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          animationDuration={1500}
                        />
                        <Line
                          type="monotone"
                          dataKey="p95"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          animationDuration={1500}
                        />
                        <Line
                          type="monotone"
                          dataKey="p99"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', r: 4 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Sin datos de latencia disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Success Rate by Channel - Bar Chart */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Tasa de Éxito por Canal</CardTitle>
                  <CardDescription>Porcentaje de firmas completadas exitosamente</CardDescription>
                </CardHeader>
                <CardContent>
                  {channelSuccessData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={channelSuccessData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="canal" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="tasa" fill="#00a859" radius={[8, 8, 0, 0]} animationDuration={1500}>
                          {channelSuccessData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Sin datos de éxito por canal disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Provider Health */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Estado de Proveedores</CardTitle>
                  <CardDescription>Salud y disponibilidad de servicios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(metrics?.providerHealth || []).map((provider, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={`h-2 w-2 rounded-full ${
                              provider.status === 'healthy'
                                ? 'bg-green-500'
                                : provider.status === 'degraded'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            animate={{
                              scale: provider.status === 'healthy' ? [1, 1.2, 1] : 1,
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'loop',
                            }}
                          />
                          <span className="font-medium text-sm">{provider.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {provider.circuitState}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <motion.span
                            className="text-xs text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 + 0.2 }}
                          >
                            {provider.uptime}% uptime
                          </motion.span>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 + 0.3, type: 'spring' }}
                          >
                            <Badge
                              variant={provider.status === 'healthy' ? 'default' : 'secondary'}
                              className={
                                provider.status === 'healthy'
                                  ? 'bg-green-500/10 text-green-700'
                                  : provider.status === 'degraded'
                                    ? 'bg-yellow-500/10 text-yellow-700'
                                    : 'bg-red-500/10 text-red-700'
                              }
                            >
                              {provider.status === 'healthy' ? 'Saludable' : provider.status === 'degraded' ? 'Degradado' : 'Caído'}
                            </Badge>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                    {(!metrics?.providerHealth || metrics.providerHealth.length === 0) && (
                      <div className="text-center text-muted-foreground py-4">
                        Sin datos de proveedores disponibles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - 1/3 */}
          <motion.div className="space-y-6" variants={containerVariants}>
            {/* Quick Actions */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/admin/rules">
                      <Button className="w-full bg-primary hover:bg-primary/90 justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Gestionar Reglas
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/admin/metrics">
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Ver Métricas
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link href="/admin/signatures">
                      <Button variant="outline" className="w-full justify-start">
                        <Activity className="mr-2 h-4 w-4" />
                        Monitorear Firmas
                      </Button>
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(metrics?.recentActivity || []).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        className="flex gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ x: 4 }}
                      >
                        <motion.div
                          className="mt-0.5"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                        >
                          {activity.type === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {activity.type === 'warning' && (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          {activity.type === 'error' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {activity.type === 'info' && (
                            <Activity className="h-4 w-4 text-blue-500" />
                          )}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.relativeTime}</p>
                        </div>
                      </motion.div>
                    ))}
                    {(!metrics?.recentActivity || metrics.recentActivity.length === 0) && (
                      <div className="text-center text-muted-foreground py-4">
                        Sin actividad reciente
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div variants={cardVariants}>
              <Card className={`bg-white dark:bg-card shadow-sm ${
                (metrics?.overview.circuitBreakersOpen || 0) === 0 
                  ? 'border-green-200 dark:border-green-800' 
                  : 'border-yellow-200 dark:border-yellow-800'
              }`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <motion.div
                      className={`h-2 w-2 rounded-full ${
                        (metrics?.overview.circuitBreakersOpen || 0) === 0 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'loop',
                      }}
                    />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <span className="text-muted-foreground">Proveedores</span>
                      <Badge className={
                        metrics?.overview.activeProviders === metrics?.overview.totalProviders
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-yellow-500/10 text-yellow-700'
                      }>
                        {metrics?.overview.activeProviders}/{metrics?.overview.totalProviders} Activos
                      </Badge>
                    </motion.div>
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <span className="text-muted-foreground">Circuit Breakers</span>
                      <Badge className={
                        (metrics?.overview.circuitBreakersOpen || 0) === 0
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-red-500/10 text-red-700'
                      }>
                        {(metrics?.overview.circuitBreakersOpen || 0) === 0 ? 'Todos cerrados' : `${metrics?.overview.circuitBreakersOpen} abiertos`}
                      </Badge>
                    </motion.div>
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <span className="text-muted-foreground">Reglas Routing</span>
                      <Badge className="bg-blue-500/10 text-blue-700">
                        {metrics?.overview.routingRulesCount || 0} activas
                      </Badge>
                    </motion.div>
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <span className="text-muted-foreground">Tasa de Éxito</span>
                      <Badge className={
                        (metrics?.overview.successRate || 0) >= 95
                          ? 'bg-green-500/10 text-green-700'
                          : (metrics?.overview.successRate || 0) >= 90
                            ? 'bg-yellow-500/10 text-yellow-700'
                            : 'bg-red-500/10 text-red-700'
                      }>
                        {metrics?.overview.successRate || 0}%
                      </Badge>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
