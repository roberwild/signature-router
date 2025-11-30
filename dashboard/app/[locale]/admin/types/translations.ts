// Type definitions for admin panel translations
// These types ensure type safety for all translation keys used in admin UI components

export interface AdminTranslations {
  navigation?: {
    dashboard?: string;
    leads?: string;
    conversations?: string;
    serviceRequests?: string;
    messages?: string;
    questionnaires?: string;
    performance?: string;
    organizations?: string;
    users?: string;
    revenue?: string;
    emailSettings?: string;
    emailTemplates?: string;
    configuration?: string;
  };
  sidebar?: {
    viewAnalytics?: string;
    adminPanel?: string;
    mineryGuard?: string;
    helpSupport?: string;
    platformAdmin?: string;
    adminAccount?: string;
    backToOrganizations?: string;
    signOut?: string;
    badges?: {
      new?: string;
      wip?: string;
      mockup?: string;
    };
  };
}