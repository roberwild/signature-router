import type { Question } from '~/data/lead-qualification/default-questionnaire';
import type { LeadProfile } from '~/components/questionnaires/shared/types';

// Question equivalence mapping for deduplication
const QUESTION_EQUIVALENCE: Record<string, string[]> = {
  'budget': ['security_budget', 'it_budget', 'annual_budget'],
  'company_size': ['employees', 'organization_size', 'team_size'],
  'timeline': ['implementation_timeline', 'decision_timeline', 'project_timeline'],
  'industry': ['sector', 'vertical', 'business_sector'],
  'role': ['position', 'job_title', 'designation'],
  'decision_authority': ['decision_capacity', 'purchase_authority'],
};

export class QuestionDeduplicationService {
  /**
   * Get unanswered questions for a lead, filtering out already answered questions
   * and their equivalents
   */
  static getUnansweredQuestions(
    lead: LeadProfile,
    questionSet: Question[]
  ): Question[] {
    // Combine all responses
    const allResponses = {
      ...lead.initialResponses,
      ...lead.followUpResponses
    };

    // Build set of answered question IDs including equivalents
    const answeredIds = new Set<string>();
    
    Object.keys(allResponses).forEach(questionId => {
      // Add the question itself
      answeredIds.add(questionId);
      
      // Add all equivalent questions
      const equivalents = this.getEquivalentQuestions(questionId);
      equivalents.forEach(eq => answeredIds.add(eq));
    });

    // Filter out answered questions
    return questionSet.filter(question => !answeredIds.has(question.id));
  }

  /**
   * Get all equivalent question IDs for a given question
   */
  private static getEquivalentQuestions(questionId: string): string[] {
    const equivalents: string[] = [];
    
    // Check if this question is a key or value in the equivalence map
    for (const [key, variants] of Object.entries(QUESTION_EQUIVALENCE)) {
      if (questionId === key) {
        // This question is a key, add all its variants
        equivalents.push(...variants);
      } else if (variants.includes(questionId)) {
        // This question is a variant, add the key and other variants
        equivalents.push(key);
        equivalents.push(...variants.filter(v => v !== questionId));
      }
    }
    
    return equivalents;
  }

  /**
   * Check if a specific question has already been answered
   * (including equivalent questions)
   */
  static isQuestionAnswered(
    lead: LeadProfile,
    questionId: string
  ): boolean {
    const allResponses = {
      ...lead.initialResponses,
      ...lead.followUpResponses
    };

    // Check direct match
    if (questionId in allResponses) {
      return true;
    }

    // Check equivalent questions
    const equivalents = this.getEquivalentQuestions(questionId);
    return equivalents.some(eq => eq in allResponses);
  }

  /**
   * Get the value of an answered question, checking equivalents if needed
   */
  static getAnswerValue(
    lead: LeadProfile,
    questionId: string
  ): unknown | undefined {
    const allResponses = {
      ...lead.initialResponses,
      ...lead.followUpResponses
    };

    // Check direct match
    if (questionId in allResponses) {
      return allResponses[questionId];
    }

    // Check equivalent questions
    const equivalents = this.getEquivalentQuestions(questionId);
    for (const eq of equivalents) {
      if (eq in allResponses) {
        return allResponses[eq];
      }
    }

    return undefined;
  }

  /**
   * Merge responses while handling equivalent questions
   * If there are conflicts (different answers to equivalent questions),
   * the newer response takes precedence
   */
  static mergeResponses(
    existingResponses: Record<string, unknown>,
    newResponses: Record<string, unknown>
  ): Record<string, unknown> {
    const merged = { ...existingResponses };

    Object.entries(newResponses).forEach(([questionId, value]) => {
      // Add the new response
      merged[questionId] = value;

      // Remove any equivalent questions that might conflict
      const equivalents = this.getEquivalentQuestions(questionId);
      equivalents.forEach(eq => {
        if (eq in merged && eq !== questionId) {
          console.warn(`Removing equivalent question ${eq} due to new answer for ${questionId}`);
          delete merged[eq];
        }
      });
    });

    return merged;
  }
}