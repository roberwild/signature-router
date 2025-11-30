/**
 * Admin Metrics DTOs
 * Type definitions for admin dashboard metrics
 */

export interface AdminMetricsDto {
  // Basic platform metrics
  organizations: number;
  users: number;
  unreadMessages: number;
  pendingServiceRequests: number;

  // Business metrics
  monthlyRevenue: number;
  pipelineValue: number;
  conversionRate: number;
  avgDealSize: number;

  // Recent items
  recentRequests: ServiceRequestSummary[];
  recentLeads: LeadSummary[];

  // Chart data
  revenueData: RevenueChartData[];
  conversionFunnel: ConversionFunnelData;
}

export interface ServiceRequestSummary {
  id: string;
  serviceName: string;
  organizationName: string;
  contactName: string;
  status: string;
  createdAt: Date;
}

export interface LeadSummary {
  id: string;
  organizationName: string;
  leadScore: number;
  leadClassification: string;
  createdAt: Date;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  deals: number;
}

export interface ConversionFunnelData {
  lead: number;
  qualified: number;
  opportunity: number;
  customer: number;
}

