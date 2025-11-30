import { cache } from 'react';

export interface IntegrationProvider {
  id: string;
  name: string;
  displayName: string;
  category: 'crm' | 'email' | 'marketing' | 'analytics';
  description: string;
  logoUrl?: string;
  capabilities: string[];
  isPopular: boolean;
  isConnected: boolean;
}

export interface IntegrationConfig {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'error' | 'warning';
  syncSettings: {
    frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
    autoSync: boolean;
  };
  stats: {
    totalSyncs: number;
    successRate: number;
    lastSuccessfulSync?: Date;
  };
}

export interface IntegrationData {
  providers: IntegrationProvider[];
  configurations: IntegrationConfig[];
  stats: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalSyncs: number;
    successRate: number;
    lastSyncAt?: Date;
  };
  recommendations: Array<{
    type: 'setup' | 'optimize' | 'troubleshoot';
    title: string;
    description: string;
    providerId?: string;
  }>;
}

// Mock data for demonstration
export const getIntegrationData = cache(
  async (): Promise<IntegrationData> => {
    // In a real implementation, this would fetch from the database
    const providers: IntegrationProvider[] = [
      {
        id: '1',
        name: 'salesforce',
        displayName: 'Salesforce',
        category: 'crm',
        description: 'World\'s #1 CRM platform for managing leads and customer relationships',
        logoUrl: '/logos/salesforce.png',
        capabilities: ['Lead Export', 'Contact Sync', 'Opportunity Tracking', 'Custom Fields'],
        isPopular: true,
        isConnected: true,
      },
      {
        id: '2',
        name: 'hubspot',
        displayName: 'HubSpot',
        category: 'crm',
        description: 'Inbound marketing, sales, and service software that helps companies attract visitors, convert leads, and close customers',
        logoUrl: '/logos/hubspot.png',
        capabilities: ['Lead Export', 'Contact Sync', 'Email Marketing', 'Analytics'],
        isPopular: true,
        isConnected: false,
      },
      {
        id: '3',
        name: 'mailchimp',
        displayName: 'Mailchimp',
        category: 'email',
        description: 'All-in-one marketing platform for small businesses to grow their audience and engage customers',
        logoUrl: '/logos/mailchimp.png',
        capabilities: ['Email Lists', 'Campaign Management', 'Audience Segmentation', 'Analytics'],
        isPopular: true,
        isConnected: true,
      },
      {
        id: '4',
        name: 'pipedrive',
        displayName: 'Pipedrive',
        category: 'crm',
        description: 'Sales CRM and pipeline management tool designed to help small sales teams manage intricate or lengthy sales processes',
        logoUrl: '/logos/pipedrive.png',
        capabilities: ['Lead Export', 'Deal Tracking', 'Activity Logging', 'Reporting'],
        isPopular: false,
        isConnected: false,
      },
      {
        id: '5',
        name: 'sendgrid',
        displayName: 'SendGrid',
        category: 'email',
        description: 'Cloud-based SMTP provider that allows you to send email without having to maintain email servers',
        logoUrl: '/logos/sendgrid.png',
        capabilities: ['Transactional Email', 'Email API', 'Delivery Analytics', 'Template Management'],
        isPopular: false,
        isConnected: false,
      },
      {
        id: '6',
        name: 'google-analytics',
        displayName: 'Google Analytics',
        category: 'analytics',
        description: 'Web analytics service that tracks and reports website traffic and user behavior',
        logoUrl: '/logos/google-analytics.png',
        capabilities: ['Event Tracking', 'Conversion Tracking', 'User Analytics', 'Custom Reports'],
        isPopular: true,
        isConnected: false,
      }
    ];

    const configurations: IntegrationConfig[] = [
      {
        id: 'config-1',
        providerId: '1',
        providerName: 'Salesforce',
        name: 'Main Salesforce Connection',
        description: 'Primary integration for lead and contact sync',
        isEnabled: true,
        lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastSyncStatus: 'success',
        syncSettings: {
          frequency: 'hourly',
          autoSync: true,
        },
        stats: {
          totalSyncs: 156,
          successRate: 94.2,
          lastSuccessfulSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      {
        id: 'config-2',
        providerId: '3',
        providerName: 'Mailchimp',
        name: 'Newsletter Subscribers',
        description: 'Sync qualified leads to newsletter audience',
        isEnabled: true,
        lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        lastSyncStatus: 'warning',
        syncSettings: {
          frequency: 'daily',
          autoSync: true,
        },
        stats: {
          totalSyncs: 87,
          successRate: 89.7,
          lastSuccessfulSync: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      },
    ];

    const stats = {
      totalIntegrations: providers.length,
      activeIntegrations: configurations.filter(c => c.isEnabled).length,
      totalSyncs: configurations.reduce((sum, c) => sum + c.stats.totalSyncs, 0),
      successRate: configurations.length > 0 
        ? configurations.reduce((sum, c) => sum + c.stats.successRate, 0) / configurations.length
        : 0,
      lastSyncAt: configurations
        .map(c => c.lastSyncAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0],
    };

    const recommendations = [
      {
        type: 'setup' as const,
        title: 'Connect HubSpot',
        description: 'HubSpot is a popular CRM choice that could help centralize your lead management',
        providerId: '2',
      },
      {
        type: 'troubleshoot' as const,
        title: 'Mailchimp Sync Issues',
        description: 'Your Mailchimp integration has a lower success rate and may need attention',
        providerId: '3',
      },
      {
        type: 'optimize' as const,
        title: 'Enable Google Analytics',
        description: 'Track lead behavior and conversion funnel performance with Google Analytics integration',
        providerId: '6',
      },
    ];

    return {
      providers,
      configurations,
      stats,
      recommendations,
    };
  }
);