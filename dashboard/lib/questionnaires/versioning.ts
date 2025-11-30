import type { Question } from '~/data/lead-qualification/default-questionnaire';

export type MigrationStrategy = 
  | 'APPEND_ONLY'    // Only add new questions, preserve all old responses
  | 'REMAP'          // Map old question IDs to new ones
  | 'RE_ASK'         // Mark specific questions for re-asking
  | 'FULL_REFRESH';  // Archive old responses, start fresh

export interface QuestionnaireVersion {
  id: string;
  version: number;
  questions: Question[];
  migrationStrategy?: {
    type: MigrationStrategy;
    mapping?: Record<string, string>; // For REMAP strategy
    questionIds?: string[]; // For RE_ASK strategy
    newQuestions?: string[]; // New questions added in this version
  };
  createdAt: Date;
  deprecatedAt?: Date;
}

export interface VersionMigrationResult {
  migratedResponses: Record<string, unknown>;
  questionsToReAsk: string[];
  archivedResponses?: Record<string, unknown>;
}

export class QuestionVersionManager {
  /**
   * Migrate responses from one version to another
   */
  static async migrateResponses(
    responses: Record<string, unknown>,
    fromVersion: QuestionnaireVersion,
    toVersion: QuestionnaireVersion
  ): Promise<VersionMigrationResult> {
    const strategy = toVersion.migrationStrategy;
    
    if (!strategy) {
      // Default to APPEND_ONLY if no strategy specified
      return this.appendOnlyMigration(responses, toVersion);
    }

    switch (strategy.type) {
      case 'APPEND_ONLY':
        return this.appendOnlyMigration(responses, toVersion);
        
      case 'REMAP':
        return this.remapMigration(responses, strategy.mapping || {});
        
      case 'RE_ASK':
        return this.reAskMigration(responses, strategy.questionIds || []);
        
      case 'FULL_REFRESH':
        return this.fullRefreshMigration(responses);
        
      default:
        throw new Error(`Unknown migration strategy: ${strategy.type}`);
    }
  }

  /**
   * APPEND_ONLY: Keep all existing responses, only add new questions
   */
  private static appendOnlyMigration(
    responses: Record<string, unknown>,
    _toVersion: QuestionnaireVersion
  ): VersionMigrationResult {
    // All existing responses are preserved
    return {
      migratedResponses: { ...responses },
      questionsToReAsk: []
    };
  }

  /**
   * REMAP: Map old question IDs to new ones
   */
  private static remapMigration(
    responses: Record<string, unknown>,
    mapping: Record<string, string>
  ): VersionMigrationResult {
    const migratedResponses: Record<string, unknown> = {};
    
    Object.entries(responses).forEach(([oldId, value]) => {
      const newId = mapping[oldId] || oldId;
      migratedResponses[newId] = value;
    });

    return {
      migratedResponses,
      questionsToReAsk: []
    };
  }

  /**
   * RE_ASK: Mark specific questions for re-asking
   */
  private static reAskMigration(
    responses: Record<string, unknown>,
    questionIds: string[]
  ): VersionMigrationResult {
    const migratedResponses = { ...responses };
    
    // Remove questions that need to be re-asked
    questionIds.forEach(id => {
      delete migratedResponses[id];
    });

    return {
      migratedResponses,
      questionsToReAsk: questionIds
    };
  }

  /**
   * FULL_REFRESH: Archive all old responses and start fresh
   */
  private static fullRefreshMigration(
    responses: Record<string, unknown>
  ): VersionMigrationResult {
    return {
      migratedResponses: {},
      questionsToReAsk: [],
      archivedResponses: { ...responses }
    };
  }

  /**
   * Check if a version is compatible with another
   */
  static isVersionCompatible(
    fromVersion: number,
    toVersion: number
  ): boolean {
    // Versions are compatible if the difference is <= 2
    // This prevents major breaking changes
    return Math.abs(toVersion - fromVersion) <= 2;
  }

  /**
   * Get the migration path between two versions
   */
  static getMigrationPath(
    fromVersion: number,
    toVersion: number,
    allVersions: QuestionnaireVersion[]
  ): QuestionnaireVersion[] {
    if (fromVersion === toVersion) {
      return [];
    }

    const _path: QuestionnaireVersion[] = [];
    const sortedVersions = allVersions
      .filter(v => {
        if (fromVersion < toVersion) {
          return v.version > fromVersion && v.version <= toVersion;
        } else {
          return v.version < fromVersion && v.version >= toVersion;
        }
      })
      .sort((a, b) => {
        if (fromVersion < toVersion) {
          return a.version - b.version;
        } else {
          return b.version - a.version;
        }
      });

    return sortedVersions;
  }

  /**
   * Validate that responses match the expected version schema
   */
  static validateResponses(
    responses: Record<string, unknown>,
    version: QuestionnaireVersion
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validQuestionIds = new Set(version.questions.map(q => q.id));

    // Check for responses to non-existent questions
    Object.keys(responses).forEach(questionId => {
      if (!validQuestionIds.has(questionId) && !questionId.startsWith('_')) {
        errors.push(`Response for unknown question: ${questionId}`);
      }
    });

    // Check required questions are answered
    version.questions
      .filter(q => q.required)
      .forEach(question => {
        if (!(question.id in responses)) {
          errors.push(`Missing required question: ${question.id}`);
        }
      });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}