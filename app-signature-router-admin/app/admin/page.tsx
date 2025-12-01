'use client';

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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricCard } from '@/components/admin/metric-card';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
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
  RadialBarChart,
  RadialBar,
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

export default function AdminDashboardPage() {
  // Mock data - TODO: Conectar con tu backend Spring Boot
  const metrics = {
    totalSignatures: 12543,
    activeSignatures: 47,
    successRate: 98.5,
    avgResponseTime: 1.2,
    providersActive: 4,
    providersTotal: 5,
    routingRules: 12,
    circuitBreakerOpen: 0,
    todaySignatures: 234,
    failedToday: 3,
    channels: {
      sms: { total: 8521, success: 8434 },
      push: { total: 2134, success: 2098 },
      voice: { total: 1543, success: 1512 },
      biometric: { total: 345, success: 341 },
    },
  };

  const providerHealth = [
    { name: 'Twilio SMS', status: 'healthy', uptime: 99.9 },
    { name: 'OneSignal Push', status: 'healthy', uptime: 99.8 },
    { name: 'Vonage Voice', status: 'degraded', uptime: 95.2 },
    { name: 'BioCatch', status: 'healthy', uptime: 99.7 },
    { name: 'AWS SNS Backup', status: 'healthy', uptime: 100 },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'success',
      message: 'Firma SMS completada - Cliente #45231',
      time: 'Hace 2 min',
    },
    {
      id: 2,
      type: 'warning',
      message: 'Fallback activado - Twilio → AWS SNS',
      time: 'Hace 5 min',
    },
    {
      id: 3,
      type: 'success',
      message: 'Firma PUSH completada - Cliente #45229',
      time: 'Hace 8 min',
    },
    {
      id: 4,
      type: 'info',
      message: 'Nueva regla de routing activada',
      time: 'Hace 15 min',
    },
  ];

  // Datos para gráficas
  const channelPieData = [
    { name: 'SMS', value: metrics.channels.sms.total, color: '#3b82f6' },
    { name: 'Push', value: metrics.channels.push.total, color: '#8b5cf6' },
    { name: 'Voice', value: metrics.channels.voice.total, color: '#f97316' },
    { name: 'Biometric', value: metrics.channels.biometric.total, color: '#10b981' },
  ];

  const hourlyData = [
    { hour: '00:00', firmas: 45, exito: 44 },
    { hour: '04:00', firmas: 32, exito: 31 },
    { hour: '08:00', firmas: 189, exito: 186 },
    { hour: '12:00', firmas: 234, exito: 230 },
    { hour: '16:00', firmas: 198, exito: 195 },
    { hour: '20:00', firmas: 156, exito: 153 },
  ];

  const performanceData = [
    { time: '00:00', p50: 0.8, p95: 1.2, p99: 1.8 },
    { time: '04:00', p50: 0.7, p95: 1.1, p99: 1.6 },
    { time: '08:00', p50: 1.0, p95: 1.5, p99: 2.1 },
    { time: '12:00', p50: 1.2, p95: 1.8, p99: 2.4 },
    { time: '16:00', p50: 1.1, p95: 1.6, p99: 2.2 },
    { time: '20:00', p50: 0.9, p95: 1.4, p99: 1.9 },
  ];

  const successRateData = metrics.channels;
  const channelSuccessData = Object.entries(successRateData).map(([channel, data]) => ({
    canal: channel.toUpperCase(),
    tasa: ((data.success / data.total) * 100).toFixed(1),
    total: data.total,
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981'];

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <AdminPageTitle
              title="Signature Router Admin"
              info="Gestión y monitoreo del sistema de routing de firmas"
            />
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
              title="Firmas Totales"
              value={metrics.totalSignatures.toLocaleString()}
              description="Total procesadas"
              icon={FileText}
              trend="up"
              trendValue="+8%"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Firmas Activas"
              value={metrics.activeSignatures}
              description="En proceso ahora"
              icon={Activity}
              color="warning"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Tasa de Éxito"
              value={`${metrics.successRate}%`}
              description="Últimas 24h"
              icon={CheckCircle2}
              color="success"
              trend="up"
              trendValue="+0.3%"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Tiempo Respuesta"
              value={`${metrics.avgResponseTime}s`}
              description="P95 promedio"
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
              value={`${metrics.providersActive}/${metrics.providersTotal}`}
              description="Conectados"
              icon={Activity}
              color={metrics.providersActive === metrics.providersTotal ? 'success' : 'warning'}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Reglas de Routing"
              value={metrics.routingRules}
              description="Configuradas"
              icon={Settings}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Circuit Breakers"
              value={metrics.circuitBreakerOpen}
              description="Abiertos"
              icon={Shield}
              color={metrics.circuitBreakerOpen === 0 ? 'success' : 'error'}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Hoy"
              value={metrics.todaySignatures}
              description={`${metrics.failedToday} fallos`}
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
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={hourlyData}>
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
                      />
                      <Area
                        type="monotone"
                        dataKey="exito"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorExito)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Latencia del Sistema</CardTitle>
                  <CardDescription>P50, P95 y P99 en segundos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={performanceData}>
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
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={channelSuccessData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="canal" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[95, 100]} />
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
                    {providerHealth.map((provider, idx) => (
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
                                  : 'bg-yellow-500/10 text-yellow-700'
                              }
                            >
                              {provider.status === 'healthy' ? 'Saludable' : 'Degradado'}
                            </Badge>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
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
                    <Button className="w-full bg-primary hover:bg-primary/90 justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Gestionar Reglas
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Ver Métricas
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="mr-2 h-4 w-4" />
                      Monitorear Firmas
                    </Button>
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
                    {recentActivity.map((activity, index) => (
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
                          {activity.type === 'info' && (
                            <Activity className="h-4 w-4 text-blue-500" />
                          )}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-green-500"
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
                    {['API', 'Kafka', 'Database', 'Vault'].map((service, index) => (
                      <motion.div
                        key={service}
                        className="flex justify-between"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                      >
                        <span className="text-muted-foreground">{service}</span>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                        >
                          <Badge className="bg-green-500/10 text-green-700">Operativo</Badge>
                        </motion.div>
                      </motion.div>
                    ))}
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
