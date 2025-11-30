// Interfaces for scoring configuration
interface ScoringOption {
  value: string;
  score: number;
}

interface ScoringQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'text_area';
  scoring_weight: Record<string, number>;
  options?: ScoringOption[];
}

interface ScoringConfig {
  questions?: ScoringQuestion[];
  components?: Record<string, number>;
}

interface ThresholdConfig {
  A1: number;
  B1: number;
  C1: number;
  D1: number;
}

export function calculateTextEngagementScore(text: string): number {
  if (!text) return 0;
  
  let score = 10; // Base score for writing anything
  
  if (text.length > 50) score += 5;
  if (text.length > 200) score += 5;
  
  // Check for keywords
  const keywords: Record<string, number> = {
    "urgente": 10,
    "inmediato": 10,
    "hackeado": 15,
    "nis-2": 10,
    "nis2": 10,
    "iso": 5,
    "27001": 5,
    "gdpr": 5,
    "rgpd": 5,
    "auditoría": 8,
    "pentest": 8,
    "incidente": 10
  };
  
  const lowerText = text.toLowerCase();
  Object.entries(keywords).forEach(([keyword, points]) => {
    if (lowerText.includes(keyword)) {
      score += points;
    }
  });
  
  return Math.min(score, 50); // Cap at 50 points
}

export function calculateLeadScore(
  responses: Record<string, unknown>,
  scoringConfig: ScoringConfig,
  textEngagementScore: number = 0
): number {
  let score = 0;
  const componentScores: Record<string, number> = {
    urgency: 0,
    budget: 0,
    fit: 0,
    engagement: 0,
    decision: 0
  };

  // Calculate component scores based on responses
  Object.entries(responses).forEach(([questionId, response]) => {
    const questionConfig = scoringConfig.questions?.find((q: ScoringQuestion) => q.id === questionId);
    
    if (questionConfig?.scoring_weight) {
      Object.entries(questionConfig.scoring_weight).forEach(([component, weight]) => {
        let questionScore = 0;
        
        if (questionConfig.type === 'single_choice' && questionConfig.options) {
          const option = questionConfig.options.find((o: ScoringOption) => o.value === response);
          if (option?.score) {
            questionScore = option.score;
          }
        } else if (questionConfig.type === 'multiple_choice') {
          // Score based on number of selections
          const selectedCount = Array.isArray(response) ? response.length : 0;
          questionScore = selectedCount * 5; // 5 points per selection
        } else if ((questionConfig.type === 'text_area' || questionConfig.type === 'text') && response) {
          // Handle both text and text_area types with engagement scoring
          if (typeof response === 'string') {
            questionScore = textEngagementScore;
          }
        }
        
        componentScores[component] = (componentScores[component] || 0) + (questionScore * (weight as number));
      });
    }
  });

  // Apply component weights
  Object.entries(scoringConfig.components || {}).forEach(([component, weight]) => {
    score += componentScores[component] * (weight as number);
  });

  return Math.round(score);
}

export function getLeadCategory(score: number, thresholds: ThresholdConfig): 'A1' | 'B1' | 'C1' | 'D1' {
  if (score >= thresholds.A1) return 'A1';
  if (score >= thresholds.B1) return 'B1';
  if (score >= thresholds.C1) return 'C1';
  return 'D1';
}

export function calculateProfileCompleteness(
  initialResponses: Record<string, unknown>,
  followUpResponses: Record<string, unknown>,
  totalQuestions: number
): number {
  const answeredQuestions = Object.keys({
    ...initialResponses,
    ...followUpResponses
  }).length;
  
  return Math.round((answeredQuestions / totalQuestions) * 100);
}