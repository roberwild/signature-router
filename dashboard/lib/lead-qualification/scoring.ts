import { defaultQuestionnaire } from '~/data/lead-qualification/default-questionnaire';

export interface LeadScoreResult {
  score: number;
  classification: 'A1' | 'B1' | 'C1' | 'D1';
  components: {
    urgency: number;
    budget: number;
    fit: number;
    engagement: number;
    decision: number;
  };
}

export function calculateLeadScore(responses: Record<string, unknown>): LeadScoreResult {
  const components = {
    urgency: 0,
    budget: 0,
    fit: 0,
    engagement: 0,
    decision: 0
  };

  const questions = defaultQuestionnaire.questions;
  
  // Process each response
  for (const question of questions) {
    const response = responses[question.id];
    
    if (!response) continue;
    
    // Get scoring weight for this question
    const weights = question.scoring_weight || {};
    
    // Calculate score based on question type and response
    if (question.type === 'single_choice' && question.options) {
      const selectedOption = question.options.find(opt => opt.value === response);
      if (selectedOption?.score) {
        // Distribute the score across the weighted components
        Object.entries(weights).forEach(([component, weight]) => {
          components[component as keyof typeof components] += selectedOption.score! * (weight as number);
        });
      }
    }
    
    // Award engagement points for answering optional questions
    if (!question.required && response) {
      components.engagement += 1;
    }
    
    // Special handling for specific questions
    switch (question.id) {
      case 'recent_incidents':
        if (response === 'urgent') components.urgency = 35;
        else if (response === 'resolved') components.urgency = 20;
        else if (response === 'preventive') components.urgency = 10;
        else components.urgency = 5;
        break;
        
      case 'company_size': {
        const sizeScores: Record<string, number> = {
          '200+': 25,
          '51-200': 20,
          '11-50': 15,
          '1-10': 10
        };
        if (typeof response === 'string') {
          components.budget = sizeScores[response] || 5;
        }
        break;
      }
        
      case 'main_concern':
        if (response) components.fit = 20;
        break;
        
      case 'compliance':
        if (Array.isArray(response) && response.length > 0 && !response.includes('none')) {
          components.fit = Math.max(components.fit, 15);
        }
        break;
        
      case 'role': {
        const roleScores: Record<string, number> = {
          'ceo': 10,
          'cto': 10,
          'ciso': 10,
          'it_manager': 8,
          'other_manager': 5,
          'technical': 3,
          'other': 1
        };
        if (typeof response === 'string') {
          components.decision = Math.max(components.decision, roleScores[response] || 0);
        }
        break;
      }
        
      case 'decision_capacity': {
        const decisionScores: Record<string, number> = {
          'full': 10,
          'influence': 7,
          'recommend': 4,
          'none': 1
        };
        if (typeof response === 'string') {
          components.decision = Math.max(components.decision, decisionScores[response] || 0);
        }
        break;
      }
        
      case 'security_budget': {
        const budgetScores: Record<string, number> = {
          'over_100k': 20,
          '50k_100k': 15,
          '10k_50k': 10,
          'under_10k': 5,
          'none': 0
        };
        const budgetScore = typeof response === 'string' ? (budgetScores[response] || 0) : 0;
        components.budget = Math.max(components.budget, budgetScore * 0.6); // 60% weight
        components.engagement += budgetScore * 0.02; // Small engagement bonus
        break;
      }
        
      case 'implementation_timeline': {
        const timelineScores: Record<string, number> = {
          'immediate': 10,
          'quarter': 7,
          'year': 4,
          'exploring': 1
        };
        const timelineScore = typeof response === 'string' ? (timelineScores[response] || 0) : 0;
        components.urgency = Math.max(components.urgency, timelineScore * 1.5); // Weighted for urgency
        components.engagement += timelineScore * 0.02;
        break;
      }
        
      case 'specific_needs':
        // Award engagement points for providing detailed needs
        if (typeof response === 'string' && response.length > 50) {
          components.engagement += 3;
        } else if (typeof response === 'string' && response.length > 20) {
          components.engagement += 2;
        }
        break;
    }
  }
  
  // Cap engagement at 10
  components.engagement = Math.min(10, components.engagement);
  
  // Calculate total score
  const totalScore = Math.round(
    components.urgency +
    components.budget +
    components.fit +
    components.engagement +
    components.decision
  );
  
  // Determine classification based on thresholds
  let classification: 'A1' | 'B1' | 'C1' | 'D1';
  if (totalScore >= defaultQuestionnaire.scoring.thresholds.A1) {
    classification = 'A1';
  } else if (totalScore >= defaultQuestionnaire.scoring.thresholds.B1) {
    classification = 'B1';
  } else if (totalScore >= defaultQuestionnaire.scoring.thresholds.C1) {
    classification = 'C1';
  } else {
    classification = 'D1';
  }
  
  return {
    score: totalScore,
    classification,
    components
  };
}

export function getDeviceType(userAgent?: string): 'mobile' | 'desktop' | 'tablet' {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  
  if (/mobile|android|iphone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  return 'desktop';
}