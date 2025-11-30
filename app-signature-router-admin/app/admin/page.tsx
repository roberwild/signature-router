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
            {/* Channel Distribution */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white dark:bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Distribución por Canal</CardTitle>
                  <CardDescription>Uso y tasa de éxito por tipo de firma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(metrics.channels).map(([channel, data], index) => {
                      const successRate = ((data.success / data.total) * 100).toFixed(1);
                      return (
                        <motion.div
                          key={channel}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-sm font-medium capitalize">{channel}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {data.total.toLocaleString()} firmas
                              </span>
                            </div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                            >
                              <Badge
                                variant={parseFloat(successRate) > 98 ? 'default' : 'secondary'}
                                className={parseFloat(successRate) > 98 
                                  ? 'bg-green-500/10 text-green-700' 
                                  : 'bg-yellow-500/10 text-yellow-700'
                                }
                              >
                                {successRate}% éxito
                              </Badge>
                            </motion.div>
                          </div>
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                            style={{ transformOrigin: 'left' }}
                          >
                            <Progress value={parseFloat(successRate)} className="h-2" />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
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
