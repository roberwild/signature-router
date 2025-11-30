/**
 * Assessment Feature Type Definitions
 * These types define the structure for assessment-related data
 */

// Base Question/Answer types
export interface SurveyQuestion {
  id: string;
  text: string;
  category: string;
  type?: 'single' | 'multiple' | 'text' | 'scale';
  options?: string[];
  required?: boolean;
}

export interface AssessmentAnswer {
  questionId: string;
  value: number | string | boolean;
  timestamp?: Date;
}

// Category scores
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: number;
}

// Assessment sections
export interface AssessmentSection {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6?: number;
  q7?: number;
}

// Main Assessment type
export interface Assessment {
  id: string;
  userId?: string;
  organizationId?: string;

  // Personal info
  nombre?: string;
  email: string;
  telefono?: string;
  sector: string | null;
  empleados?: string;

  // Assessment sections
  personas: AssessmentSection;
  procesos: AssessmentSection;
  tecnologias: AssessmentSection;
  marketing?: AssessmentSection;

  // Metadata
  dataTreatment?: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Scores
  totalScore?: number;
  categoryScores?: CategoryScore[];

  // Questions and answers for export
  questionsAndAnswers?: {
    question: string;
    answer: string | number;
    category: string;
  }[];

  // Test/additional data for PDF export
  testData?: unknown;
}

// Form data type (matches the zod schema)
export interface AssessmentFormData {
  email: string;
  sector: string;
  personas: AssessmentSection;
  procesos: AssessmentSection;
  tecnologias: AssessmentSection;
  marketing?: AssessmentSection;
  empleados?: string;
  dataTreatment?: boolean;
  nombre?: string;
  telefono?: string;
}

// Props for components
export interface AssessmentFormProps {
  userId?: string;
  organizationId?: string;
  initialData?: Partial<AssessmentFormData>;
  onComplete?: (assessment: Assessment) => void;
  isEmbedded?: boolean;
}

export interface AssessmentPDFProps {
  assessment: Assessment;
  showDetails?: boolean;
}

export interface AssessmentStatsProps {
  assessmentId?: string;
  userId?: string;
  organizationId?: string;
}

// Chart data types
export interface ChartDataPoint {
  category: string;
  score: number;
  fullMark: number;
}

export interface EvolutionDataPoint {
  date: string;
  personas: number;
  procesos: number;
  tecnologias: number;
  marketing?: number;
  total: number;
}

// API Response types
export interface AssessmentResponse {
  success: boolean;
  data?: Assessment;
  error?: string;
  message?: string;
}

export interface AssessmentListResponse {
  success: boolean;
  data?: Assessment[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

// Stats types
export interface AssessmentStats {
  totalAssessments: number;
  averageScore: number;
  completionRate: number;
  categoryAverages: CategoryScore[];
  recentAssessments: Assessment[];
  evolution: EvolutionDataPoint[];
}

// Question bank item
export interface QuestionBankItem {
  id: string;
  text: string;
  category: string;
  weight?: number;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}

// Question and answer item for test data
export interface QuestionAnswerItem {
  id: string;
  question: string;
  answer: number | string;
  category: string;
}

// Export types
export interface AssessmentExport {
  assessment: Assessment;
  format: 'pdf' | 'csv' | 'json';
  includeCharts?: boolean;
  includeRecommendations?: boolean;
}