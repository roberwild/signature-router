import type { LeadProfile } from '~/components/questionnaires/shared/types';

export type Channel = 'platform' | 'email' | 'whatsapp' | 'sales_call';

export interface ChannelPreference {
  channel: Channel;
  priority: number;
  lastUsed?: Date;
  responseRate?: number;
}

export interface OrchestrationRule {
  condition: (lead: LeadProfile) => boolean;
  channels: Channel[];
  delayHours: number;
}

export class ChannelOrchestrationEngine {
  private static readonly CHANNEL_COSTS: Record<Channel, number> = {
    platform: 0,
    email: 0.01,
    whatsapp: 0.05,
    sales_call: 10
  };

  private static readonly DEFAULT_RULES: OrchestrationRule[] = [
    {
      // A1 leads: Aggressive follow-up (but not too aggressive)
      condition: (lead) => lead.leadCategory === 'A1',
      channels: ['platform', 'email', 'whatsapp', 'sales_call'],
      delayHours: 48 // Wait 2 days after registration
    },
    {
      // B1 leads: Moderate follow-up
      condition: (lead) => lead.leadCategory === 'B1',
      channels: ['platform', 'email', 'whatsapp'],
      delayHours: 72 // Wait 3 days after registration
    },
    {
      // C1 leads: Light follow-up
      condition: (lead) => lead.leadCategory === 'C1',
      channels: ['platform', 'email'],
      delayHours: 168 // Wait 1 week after registration
    },
    {
      // D1 leads: Minimal follow-up
      condition: (lead) => lead.leadCategory === 'D1',
      channels: ['platform'],
      delayHours: 336 // Wait 2 weeks after registration
    }
  ];

  /**
   * Determine the optimal channel for a lead
   */
  static selectChannel(
    lead: LeadProfile,
    preferences?: ChannelPreference[],
    lastChannelUsed?: Channel
  ): Channel {
    // Get applicable rules for this lead
    const applicableRule = this.DEFAULT_RULES.find(rule => rule.condition(lead));
    const availableChannels = applicableRule?.channels || ['platform'];

    // If we have preference data, use it
    if (preferences && preferences.length > 0) {
      const sortedPreferences = preferences
        .filter(p => availableChannels.includes(p.channel))
        .sort((a, b) => {
          // Sort by response rate first, then by priority
          const aScore = (a.responseRate || 0) * 100 + a.priority;
          const bScore = (b.responseRate || 0) * 100 + b.priority;
          return bScore - aScore;
        });

      if (sortedPreferences.length > 0) {
        return sortedPreferences[0].channel;
      }
    }

    // Implement waterfall strategy
    return this.getNextChannelInWaterfall(availableChannels, lastChannelUsed);
  }

  /**
   * Get the next channel in the waterfall sequence
   */
  private static getNextChannelInWaterfall(
    availableChannels: Channel[],
    lastChannelUsed?: Channel
  ): Channel {
    if (!lastChannelUsed) {
      return availableChannels[0];
    }

    const lastIndex = availableChannels.indexOf(lastChannelUsed);
    const nextIndex = lastIndex + 1;

    // Return next channel or loop back to first
    return nextIndex < availableChannels.length 
      ? availableChannels[nextIndex]
      : availableChannels[0];
  }

  /**
   * Calculate the optimal time to send follow-up
   */
  static getOptimalSendTime(
    lead: LeadProfile,
    channel: Channel,
    timezone?: string
  ): Date {
    const now = new Date();
    
    // Get base delay from rules
    const rule = this.DEFAULT_RULES.find(r => r.condition(lead));
    const baseDelayHours = rule?.delayHours || 24;

    // Adjust for channel-specific timing
    const channelDelays: Record<Channel, number> = {
      platform: 0, // Immediate
      email: 4, // Wait 4 hours
      whatsapp: 8, // Wait 8 hours
      sales_call: 24 // Next business day
    };

    const totalDelayHours = baseDelayHours + (channelDelays[channel] || 0);
    const sendTime = new Date(now.getTime() + totalDelayHours * 60 * 60 * 1000);

    // Adjust for business hours if needed
    if (channel === 'sales_call' || channel === 'whatsapp') {
      return this.adjustToBusinessHours(sendTime, timezone);
    }

    return sendTime;
  }

  /**
   * Adjust time to fall within business hours
   */
  private static adjustToBusinessHours(date: Date, _timezone?: string): Date {
    const hours = date.getHours();
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0) { // Sunday
      date.setDate(date.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      date.setDate(date.getDate() + 2);
    }

    // Adjust to business hours (9 AM - 6 PM)
    if (hours < 9) {
      date.setHours(9, 0, 0, 0);
    } else if (hours >= 18) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    }

    return date;
  }

  /**
   * Track channel effectiveness
   */
  static updateChannelMetrics(
    channel: Channel,
    lead: LeadProfile,
    responded: boolean,
    _responseTime?: number
  ): ChannelPreference {
    // This would typically update a database
    // For now, return a mock preference object
    return {
      channel,
      priority: responded ? 10 : 1,
      lastUsed: new Date(),
      responseRate: responded ? 1 : 0
    };
  }

  /**
   * Check if we should send another follow-up
   */
  static shouldSendFollowUp(
    lead: LeadProfile,
    lastContactDate?: Date,
    attemptCount: number = 0
  ): boolean {
    // Max attempts based on lead category
    const maxAttempts: Record<string, number> = {
      'A1': 5,
      'B1': 3,
      'C1': 2,
      'D1': 1
    };

    const maxAttemptsForLead = maxAttempts[lead.leadCategory] || 2;
    
    if (attemptCount >= maxAttemptsForLead) {
      return false;
    }

    // Check time since last contact
    if (lastContactDate) {
      const hoursSinceLastContact = 
        (Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60);
      
      // Minimum delay between attempts
      const minDelayHours: Record<string, number> = {
        'A1': 24,
        'B1': 48,
        'C1': 72,
        'D1': 168
      };

      const minDelay = minDelayHours[lead.leadCategory] || 48;
      
      if (hoursSinceLastContact < minDelay) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate the cost of using a channel
   */
  static calculateChannelCost(
    channel: Channel,
    messageCount: number = 1
  ): number {
    return this.CHANNEL_COSTS[channel] * messageCount;
  }

  /**
   * Get channel recommendations based on cost and effectiveness
   */
  static getChannelRecommendations(
    lead: LeadProfile,
    budget: number,
    preferences?: ChannelPreference[]
  ): Channel[] {
    const recommendations: Channel[] = [];
    let remainingBudget = budget;

    // Sort channels by effectiveness/cost ratio
    const channelsWithScores = (['platform', 'email', 'whatsapp', 'sales_call'] as Channel[])
      .map(channel => {
        const cost = this.CHANNEL_COSTS[channel];
        const preference = preferences?.find(p => p.channel === channel);
        const effectiveness = preference?.responseRate || 0.5;
        
        return {
          channel,
          cost,
          effectiveness,
          score: cost > 0 ? effectiveness / cost : effectiveness * 1000
        };
      })
      .sort((a, b) => b.score - a.score);

    // Add channels within budget
    for (const { channel, cost } of channelsWithScores) {
      if (cost <= remainingBudget) {
        recommendations.push(channel);
        remainingBudget -= cost;
      }
    }

    return recommendations;
  }
}