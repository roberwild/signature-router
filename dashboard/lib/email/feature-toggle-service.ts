import { db, type TransactionType } from '@workspace/database';
import { platformEmailSettingsTable, emailFeatureToggleHistoryTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { EventEmitter } from 'events';

export interface EmailFeatureToggles {
  welcomeEmails: boolean;
  passwordResetEmails: boolean;
  invitationEmails: boolean;
  feedbackEmails: boolean;
  leadQualificationEmails: boolean;
  organizationNotifications: boolean;
  adminAlerts: boolean;
}

export type EmailFeatureKey = keyof EmailFeatureToggles;

export interface FeatureToggleContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export interface FeatureToggleHistory {
  id: string;
  feature: string;
  previousState: boolean;
  newState: boolean;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  scheduledRevertAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface CacheEntry {
  value: boolean;
  expiry: number;
}

export class FeatureToggleService extends EventEmitter {
  private static instance: FeatureToggleService | null = null;
  private cache = new Map<EmailFeatureKey, CacheEntry>();
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly CRITICAL_FEATURES: EmailFeatureKey[] = ['passwordResetEmails', 'adminAlerts'];
  
  private constructor() {
    super();
    this.startCacheCleanup();
  }

  static getInstance(): FeatureToggleService {
    if (!this.instance) {
      this.instance = new FeatureToggleService();
    }
    return this.instance;
  }

  /**
   * Get default toggle states
   */
  getDefaultToggles(): EmailFeatureToggles {
    return {
      welcomeEmails: true,
      passwordResetEmails: true,
      invitationEmails: true,
      feedbackEmails: true,
      leadQualificationEmails: true,
      organizationNotifications: true,
      adminAlerts: true
    };
  }

  /**
   * Check if a feature is enabled
   */
  async isEnabled(feature: EmailFeatureKey): Promise<boolean> {
    // Check cache first
    const cached = this.cache.get(feature);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    try {
      // Load from database
      const settings = await this.loadSettings();
      const features = (settings?.features as Partial<EmailFeatureToggles>) || {};
      const isEnabled = features[feature] ?? this.getDefaultToggles()[feature];
      
      // Update cache
      this.cache.set(feature, {
        value: isEnabled,
        expiry: Date.now() + this.CACHE_TTL
      });
      
      return isEnabled;
    } catch (error) {
      console.error(`Failed to check feature toggle for ${feature}:`, error);
      // Fallback to default
      return this.getDefaultToggles()[feature];
    }
  }

  /**
   * Check multiple features at once
   */
  async areEnabled(features: EmailFeatureKey[]): Promise<Record<EmailFeatureKey, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Try to get as many from cache as possible
    const uncachedFeatures: EmailFeatureKey[] = [];
    
    for (const feature of features) {
      const cached = this.cache.get(feature);
      if (cached && Date.now() < cached.expiry) {
        results[feature] = cached.value;
      } else {
        uncachedFeatures.push(feature);
      }
    }

    // Load uncached features from database
    if (uncachedFeatures.length > 0) {
      try {
        const settings = await this.loadSettings();
        const defaults = this.getDefaultToggles();
        
        for (const feature of uncachedFeatures) {
          const features = (settings?.features as Partial<EmailFeatureToggles>) || {};
          const isEnabled = features[feature] ?? defaults[feature];
          results[feature] = isEnabled;
          
          // Update cache
          this.cache.set(feature, {
            value: isEnabled,
            expiry: Date.now() + this.CACHE_TTL
          });
        }
      } catch (error) {
        console.error('Failed to load feature toggles:', error);
        // Fallback to defaults for uncached features
        const defaults = this.getDefaultToggles();
        for (const feature of uncachedFeatures) {
          results[feature] = defaults[feature];
        }
      }
    }

    return results as Record<EmailFeatureKey, boolean>;
  }

  /**
   * Get all current toggle states
   */
  async getAllToggles(): Promise<EmailFeatureToggles> {
    const features = Object.keys(this.getDefaultToggles()) as EmailFeatureKey[];
    return await this.areEnabled(features) as EmailFeatureToggles;
  }

  /**
   * Toggle a feature on/off
   */
  async toggle(
    feature: EmailFeatureKey,
    enabled: boolean,
    context: FeatureToggleContext
  ): Promise<void> {
    // Validate critical features
    if (!enabled && this.isCriticalFeature(feature)) {
      await this.validateCriticalFeatureDisabling(feature);
    }

    try {
      await db.transaction(async (tx) => {
        // Get current settings
        const currentSettings = await this.loadSettings(tx);
        const currentFeatures = (currentSettings?.features as Partial<EmailFeatureToggles>) || this.getDefaultToggles();
        const previousState = currentFeatures[feature] ?? this.getDefaultToggles()[feature];

        // Update the feature toggle
        const updatedFeatures = {
          ...currentFeatures,
          [feature]: enabled
        };

        // Save to database
        if (currentSettings) {
          await tx
            .update(platformEmailSettingsTable)
            .set({ 
              features: updatedFeatures,
              updatedBy: context.userId,
              updatedAt: new Date()
            })
            .where(eq(platformEmailSettingsTable.id, currentSettings.id));
        } else {
          // Create new settings if none exist
          await tx
            .insert(platformEmailSettingsTable)
            .values({
              emailFrom: 'noreply@example.com', // Placeholder
              provider: 'nodemailer',
              providerConfig: {},
              features: updatedFeatures,
              updatedBy: context.userId,
              isActive: true
            });
        }

        // Record history
        await tx.insert(emailFeatureToggleHistoryTable).values({
          feature,
          previousState,
          newState: enabled,
          changedBy: context.userId,
          reason: context.reason,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        });
      });

      // Clear cache
      this.cache.delete(feature);
      
      // Emit event for real-time updates
      this.emit('toggle-changed', { 
        feature, 
        enabled, 
        previousState: !enabled,
        changedBy: context.userId 
      });

      console.log(`Feature toggle ${feature} set to ${enabled} by user ${context.userId}`);
    } catch (error) {
      console.error(`Failed to toggle feature ${feature}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update feature toggle: ${errorMessage}`);
    }
  }

  /**
   * Bulk toggle multiple features
   */
  async bulkToggle(
    enabled: boolean,
    context: FeatureToggleContext,
    excludeCritical: boolean = true
  ): Promise<void> {
    const features = Object.keys(this.getDefaultToggles()) as EmailFeatureKey[];
    const featuresToToggle = excludeCritical 
      ? features.filter(feature => !this.isCriticalFeature(feature))
      : features;

    const bulkContext = {
      ...context,
      reason: context.reason || `Bulk ${enabled ? 'enable' : 'disable'}`
    };

    // Toggle features sequentially to maintain audit trail
    for (const feature of featuresToToggle) {
      try {
        await this.toggle(feature, enabled, bulkContext);
      } catch (error) {
        console.error(`Failed to bulk toggle ${feature}:`, error);
        // Continue with other features
      }
    }

    console.log(`Bulk toggled ${featuresToToggle.length} features to ${enabled}`);
  }

  /**
   * Reset all toggles to defaults
   */
  async resetToDefaults(context: FeatureToggleContext): Promise<void> {
    const defaults = this.getDefaultToggles();
    const resetContext = {
      ...context,
      reason: context.reason || 'Reset to defaults'
    };

    for (const [feature, defaultValue] of Object.entries(defaults)) {
      try {
        await this.toggle(feature as EmailFeatureKey, defaultValue, resetContext);
      } catch (error) {
        console.error(`Failed to reset ${feature} to default:`, error);
      }
    }

    console.log('All feature toggles reset to defaults');
  }

  /**
   * Get feature toggle history
   */
  async getHistory(
    feature?: EmailFeatureKey,
    limit: number = 50
  ): Promise<FeatureToggleHistory[]> {
    try {
      const baseQuery = db.select().from(emailFeatureToggleHistoryTable);

      const filteredQuery = feature
        ? baseQuery.where(eq(emailFeatureToggleHistoryTable.feature, feature))
        : baseQuery;

      const history = await filteredQuery
        .orderBy(emailFeatureToggleHistoryTable.changedAt)
        .limit(limit);

      return history.map(record => ({
        id: record.id,
        feature: record.feature,
        previousState: record.previousState,
        newState: record.newState,
        changedBy: record.changedBy,
        changedAt: record.changedAt,
        reason: record.reason || undefined,
        scheduledRevertAt: record.scheduledRevertAt || undefined,
        ipAddress: record.ipAddress || undefined,
        userAgent: record.userAgent || undefined
      }));
    } catch (error) {
      console.error('Failed to get feature toggle history:', error);
      return [];
    }
  }

  /**
   * Check if a feature is critical
   */
  isCriticalFeature(feature: EmailFeatureKey): boolean {
    return this.CRITICAL_FEATURES.includes(feature);
  }

  /**
   * Get feature description
   */
  getFeatureDescription(feature: EmailFeatureKey): string {
    const descriptions: Record<EmailFeatureKey, string> = {
      welcomeEmails: 'Sent to new users after registration',
      passwordResetEmails: 'Critical for user access recovery',
      invitationEmails: 'Sent when users are invited to join',
      feedbackEmails: 'Notifies admins of new feedback',
      leadQualificationEmails: 'Automated lead nurturing emails',
      organizationNotifications: 'Organization-wide notifications',
      adminAlerts: 'Critical system notifications'
    };

    return descriptions[feature];
  }

  /**
   * Get feature category
   */
  getFeatureCategory(feature: EmailFeatureKey): 'user' | 'admin' | 'marketing' {
    const categories: Record<EmailFeatureKey, 'user' | 'admin' | 'marketing'> = {
      welcomeEmails: 'user',
      passwordResetEmails: 'user',
      invitationEmails: 'user',
      feedbackEmails: 'admin',
      adminAlerts: 'admin',
      organizationNotifications: 'admin',
      leadQualificationEmails: 'marketing'
    };

    return categories[feature];
  }

  /**
   * Clear all cached values
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Private: Load settings from database
   */
  private async loadSettings(tx?: TransactionType) {
    const query = tx || db;

    const [settings] = await query
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    return settings;
  }

  /**
   * Private: Validate disabling critical features
   */
  private async validateCriticalFeatureDisabling(feature: EmailFeatureKey): Promise<void> {
    if (feature === 'passwordResetEmails') {
      // Check if there are alternative authentication methods
      // For now, we'll log a warning
      console.warn(`Disabling critical feature: ${feature} - ensure alternative auth methods exist`);
    }

    if (feature === 'adminAlerts') {
      console.warn(`Disabling critical feature: ${feature} - admin notifications will be disabled`);
    }
  }

  /**
   * Private: Start cache cleanup timer
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (now >= entry.expiry) {
          this.cache.delete(key);
        }
      }
    }, this.CACHE_TTL);
  }
}

// Singleton instance
export const featureToggleService = FeatureToggleService.getInstance();