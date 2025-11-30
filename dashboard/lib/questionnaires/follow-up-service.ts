import type { Question } from '~/data/lead-qualification/default-questionnaire';
import type { LeadProfile } from '~/components/questionnaires/shared/types';
import { QuestionDeduplicationService } from './deduplication';
import { 
  qualifiedLeadFollowUp, 
  technicalAssessment, 
  complianceDeepDive 
} from '~/data/lead-qualification/extended-questionnaires';

export class FollowUpQuestionnaireService {
  /**
   * Get the next set of questions for a lead based on their score and responses
   */
  static getNextQuestions(
    lead: LeadProfile,
    maxQuestions: number = 2
  ): Question[] {
    // Determine which questionnaire set to use based on lead score
    const questionSet = this.selectQuestionnaireSet(lead);
    
    // Filter out already answered questions
    const unansweredQuestions = QuestionDeduplicationService.getUnansweredQuestions(
      lead,
      questionSet
    );

    // Prioritize questions based on importance
    const prioritizedQuestions = this.prioritizeQuestions(
      unansweredQuestions,
      lead
    );

    // Return the requested number of questions
    return prioritizedQuestions.slice(0, maxQuestions);
  }

  /**
   * Select the appropriate questionnaire set based on lead score and category
   */
  private static selectQuestionnaireSet(lead: LeadProfile): Question[] {
    // A1 leads (80+): Get detailed budget and decision info
    if (lead.leadScore >= 80 || lead.leadCategory === 'A1') {
      return qualifiedLeadFollowUp;
    }
    
    // B1 leads (55-79): Get technical assessment
    if (lead.leadScore >= 55 || lead.leadCategory === 'B1') {
      return technicalAssessment;
    }
    
    // C1 leads (30-54): Get compliance info for nurturing
    if (lead.leadScore >= 30 || lead.leadCategory === 'C1') {
      return complianceDeepDive;
    }
    
    // D1 leads: Return minimal follow-up questions
    return [
      ...qualifiedLeadFollowUp.filter(q => 
        ['role', 'sector'].includes(q.id)
      )
    ];
  }

  /**
   * Prioritize questions based on their importance and lead context
   */
  private static prioritizeQuestions(
    questions: Question[],
    _lead: LeadProfile
  ): Question[] {
    // Define priority order for question IDs
    const priorityOrder = [
      // High priority for A1/B1 leads
      'security_budget',
      'decision_capacity',
      'role',
      'it_team',
      
      // Medium priority
      'sector',
      'critical_systems',
      'sensitive_data',
      'mfa_status',
      'backup_status',
      
      // Lower priority
      'incident_plan',
      'security_training',
      'third_parties',
      'previous_audits',
      'cyber_insurance',
      'critical_users'
    ];

    // Sort questions by priority
    return questions.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.id);
      const bPriority = priorityOrder.indexOf(b.id);
      
      // If both are in priority list, sort by priority
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      
      // Prioritized questions come first
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // For non-prioritized questions, required comes first
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      
      // Otherwise maintain original order
      return 0;
    });
  }

  /**
   * Check if a lead should receive follow-up questions
   */
  static shouldShowFollowUp(lead: LeadProfile): boolean {
    // Don't show if profile is already complete
    if (lead.profileCompleteness >= 90) {
      return false;
    }

    // Check if enough time has passed since registration
    // This prevents bombarding new users immediately
    const minDaysSinceRegistration = this.getMinDaysSinceRegistration(lead.leadCategory);
    const daysSinceCreated = lead.createdAt
      ? (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    
    if (daysSinceCreated < minDaysSinceRegistration) {
      return false;
    }

    // Don't show if recently answered questions
    if (lead.lastQuestionnaireAt) {
      const hoursSinceLastQuestionnaire = 
        (Date.now() - new Date(lead.lastQuestionnaireAt).getTime()) / (1000 * 60 * 60);
      
      // Minimum cooldown period between questionnaires
      const minCooldownHours = this.getMinCooldownHours(lead.leadCategory);
      if (hoursSinceLastQuestionnaire < minCooldownHours) {
        return false;
      }
    }

    // Don't show for D1 leads with low engagement
    if (lead.leadCategory === 'D1' && lead.profileCompleteness < 20) {
      return false;
    }

    // Check if lead is snoozed
    if (lead.snoozedUntil && new Date(lead.snoozedUntil) > new Date()) {
      return false;
    }

    // Show for all other cases
    return true;
  }

  /**
   * Get minimum days to wait after registration before showing follow-up
   */
  private static getMinDaysSinceRegistration(leadCategory: string): number {
    switch (leadCategory) {
      case 'A1':
        return 2; // Wait 2 days for hot leads
      case 'B1':
        return 3; // Wait 3 days for warm leads
      case 'C1':
        return 7; // Wait 1 week for cold leads
      case 'D1':
        return 14; // Wait 2 weeks for info seekers
      default:
        return 3; // Default 3 days
    }
  }

  /**
   * Get minimum cooldown hours between questionnaire sessions
   */
  private static getMinCooldownHours(leadCategory: string): number {
    switch (leadCategory) {
      case 'A1':
        return 48; // 2 days minimum between sessions
      case 'B1':
        return 72; // 3 days minimum
      case 'C1':
        return 120; // 5 days minimum
      case 'D1':
        return 168; // 1 week minimum
      default:
        return 72; // Default 3 days
    }
  }

  /**
   * Calculate the optimal time to show follow-up questions
   */
  static getOptimalFollowUpTime(lead: LeadProfile): number {
    // Return delay in hours
    switch (lead.leadCategory) {
      case 'A1':
        return 4; // Show after 4 hours for hot leads
      case 'B1':
        return 24; // Show after 1 day for warm leads
      case 'C1':
        return 72; // Show after 3 days for cold leads
      case 'D1':
        return 168; // Show after 1 week for info seekers
      default:
        return 48; // Default to 2 days
    }
  }

  /**
   * Get behavioral triggers for showing follow-up questions
   */
  static getBehavioralTriggers(action: string): Question[] | null {
    const triggers: Record<string, string[]> = {
      'viewed_pricing': ['security_budget', 'decision_capacity'],
      'completed_assessment': ['implementation_timeline', 'it_team'],
      'downloaded_resource': ['role', 'sector'],
      'viewed_compliance_page': ['compliance', 'sensitive_data'],
      'reported_incident': ['incident_plan', 'security_training']
    };

    const questionIds = triggers[action];
    if (!questionIds) return null;

    // Map IDs to actual questions
    const allQuestions = [
      ...qualifiedLeadFollowUp,
      ...technicalAssessment,
      ...complianceDeepDive
    ];

    return questionIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }
}