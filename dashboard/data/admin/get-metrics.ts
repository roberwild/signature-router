/**
 * Admin Metrics Data Fetcher
 * Retrieves dashboard metrics for the admin panel
 */

import type {
  AdminMetricsDto,
  ServiceRequestSummary,
  LeadSummary,
  RevenueChartData,
  ConversionFunnelData,
} from '~/types/dtos/admin-metrics-dto';

/**
 * Get admin dashboard metrics
 * TODO: Replace mock data with actual database queries
 */
export async function getAdminMetrics(): Promise<AdminMetricsDto> {
  // Mock data for now - replace with actual DB queries
  const metrics: AdminMetricsDto = {
    // Basic platform metrics
    organizations: 45,
    users: 128,
    unreadMessages: 7,
    pendingServiceRequests: 12,

    // Business metrics
    monthlyRevenue: 45000,
    pipelineValue: 125000,
    conversionRate: 18.5,
    avgDealSize: 8500,

    // Recent service requests
    recentRequests: [
      {
        id: '1',
        serviceName: 'Pentesting Avanzado',
        organizationName: 'TechCorp SL',
        contactName: 'María García',
        status: 'pending',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        serviceName: 'CISO Virtual',
        organizationName: 'InnovaBank',
        contactName: 'Juan Pérez',
        status: 'contacted',
        createdAt: new Date('2024-01-14'),
      },
    ],

    // Recent leads
    recentLeads: [
      {
        id: '1',
        organizationName: 'StartupXYZ',
        leadScore: 85,
        leadClassification: 'A1',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        organizationName: 'MediCorp',
        leadScore: 62,
        leadClassification: 'B1',
        createdAt: new Date('2024-01-14'),
      },
    ],

    // Revenue chart data (last 6 months)
    revenueData: [
      { month: 'Ago', revenue: 32000, deals: 4 },
      { month: 'Sep', revenue: 38000, deals: 5 },
      { month: 'Oct', revenue: 41000, deals: 6 },
      { month: 'Nov', revenue: 39000, deals: 4 },
      { month: 'Dic', revenue: 48000, deals: 7 },
      { month: 'Ene', revenue: 45000, deals: 5 },
    ],

    // Conversion funnel
    conversionFunnel: {
      lead: 150,
      qualified: 85,
      opportunity: 35,
      customer: 18,
    },
  };

  return metrics;
}
