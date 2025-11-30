import type { Question } from '~/data/lead-qualification/default-questionnaire';

export interface QuestionnaireProps {
  questions: Question[];
  previousResponses?: Record<string, unknown>;
  onComplete?: (responses: Record<string, unknown>) => void;
  onSave?: (questionId: string, response: unknown) => void;
  isFollowUp?: boolean;
  maxQuestionsPerSession?: number;
  currentQuestionIndex?: number;
  allowSkip?: boolean;
  showProgress?: boolean;
}

export interface QuestionRendererProps {
  question: Question;
  response?: unknown;
  onChange: (value: unknown) => void;
  onOtherTextChange?: (text: string) => void;
  otherText?: string;
}

export interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export interface QuestionCardProps {
  questionNumber: number;
  question: Question;
  children: React.ReactNode;
  showHelpTooltip?: boolean;
}

export interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canGoBack: boolean;
  canProceed: boolean;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  isOptional: boolean;
  loading?: boolean;
}

export interface QuestionnaireSession {
  id: string;
  leadId: string;
  questionnaireType: 'initial' | 'follow_up_qualified' | 'technical_assessment' | 'compliance_deep_dive';
  currentIndex: number;
  responses: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  channel: 'platform' | 'email' | 'whatsapp';
}

export interface LeadProfile {
  id: string;
  email: string;
  initialResponses: Record<string, unknown>;
  followUpResponses: Record<string, unknown>;
  profileCompleteness: number;
  leadScore: number;
  leadCategory: 'A1' | 'B1' | 'C1' | 'D1';
  lastQuestionnaireAt?: Date;
  lastEditAt?: Date;
  createdAt?: Date;
  snoozedUntil?: Date;
}