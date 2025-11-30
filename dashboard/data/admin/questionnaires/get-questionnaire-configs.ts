import { db } from '@workspace/database';
import { questionnaireVersionsConfig, questionConfigsTable } from '@workspace/database';
import {  desc } from 'drizzle-orm';
import { cache } from 'react';

export interface QuestionOption {
  value: string;
  label: string;
  score?: number;
  service?: string;
}

export interface QuestionConfig {
  id: string;
  type: 'text' | 'email' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'number' | 'single_choice' | 'multiple_choice' | 'text_area';
  question: string;
  placeholder?: string;
  required: boolean;
  options?: (string | QuestionOption)[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  conditionalLogic?: {
    showIf: {
      questionId: string;
      operator: 'equals' | 'contains' | 'not_equals';
      value: string;
    };
  };
  category?: string;
  order: number;
  // Additional properties for extended question types
  minLength?: number;
  maxLength?: number;
  allow_other?: boolean;
  scoring_weight?: number;
  description?: string;
  rows?: number;
  min?: number;
  max?: number;
}

export interface QuestionnaireVersion {
  id: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  type: 'onboarding' | 'follow_up';
  questions: QuestionConfig[];
  settings: {
    allowEdit: boolean;
    showProgress: boolean;
    enableSaveProgress: boolean;
    redirectUrl?: string;
    completionMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireConfigData {
  onboardingQuestionnaires: QuestionnaireVersion[];
  followUpQuestionnaires: QuestionnaireVersion[];
  totalQuestions: number;
  activeVersions: number;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    questions: QuestionConfig[];
  }>;
}

export const getQuestionnaireConfigs = cache(
  async (): Promise<QuestionnaireConfigData> => {
    try {
      // Get questionnaire versions from the new table
      const versions = await db
        .select()
        .from(questionnaireVersionsConfig)
        .orderBy(desc(questionnaireVersionsConfig.createdAt));

      // If no versions exist, return default questionnaires
      if (versions.length === 0) {
        return createDefaultQuestionnaires();
      }

      // Get question configurations (for legacy support)
      const _questionConfigs = await db
        .select()
        .from(questionConfigsTable)
        .orderBy(questionConfigsTable.orderIndex);

      // Process the data - now using the questions directly from the versions table
      const processedVersions: QuestionnaireVersion[] = versions.map(version => {
        // Parse questions from JSONB
        const versionQuestions = Array.isArray(version.questions)
          ? version.questions as QuestionConfig[]
          : [];

        return {
          id: version.id,
          name: version.name || 'Untitled Questionnaire',
          description: version.description || undefined,
          version: version.version,
          isActive: version.isActive ?? false, // Handle null by defaulting to false
          type: (version.questionnaireType || 'onboarding') as 'onboarding' | 'follow_up',
          questions: versionQuestions,
          settings: {
            allowEdit: true,
            showProgress: true,
            enableSaveProgress: true,
            ...(version.uiConfig as {
              allowEdit?: boolean;
              showProgress?: boolean;
              enableSaveProgress?: boolean;
              redirectUrl?: string;
              completionMessage?: string;
            } || {})
          },
          createdAt: version.createdAt,
          updatedAt: version.updatedAt || version.createdAt
        };
      });

      // Separate onboarding and follow-up questionnaires
      const onboardingQuestionnaires = processedVersions.filter(v => v.type === 'onboarding');
      const followUpQuestionnaires = processedVersions.filter(v => v.type === 'follow_up');

      // If no questionnaires exist, create default ones
      if (processedVersions.length === 0) {
        return createDefaultQuestionnaires();
      }

      // Calculate summary stats
      const totalQuestions = processedVersions.reduce((sum, v) => sum + v.questions.length, 0);
      const activeVersions = processedVersions.filter(v => v.isActive).length;

      // Create template library
      const templates = [
        {
          id: 'basic-lead-qualification',
          name: 'Basic Lead Qualification',
          description: 'Standard lead qualification questions for B2B services',
          category: 'Business',
          questions: createBasicLeadQualificationTemplate()
        },
        {
          id: 'detailed-business-profile',
          name: 'Detailed Business Profile',
          description: 'Comprehensive business information collection',
          category: 'Business',
          questions: createDetailedBusinessTemplate()
        },
        {
          id: 'service-interest-assessment',
          name: 'Service Interest Assessment',
          description: 'Assess specific service needs and requirements',
          category: 'Services',
          questions: createServiceInterestTemplate()
        },
        {
          id: 'follow-up-engagement',
          name: 'Follow-up Engagement',
          description: 'Re-engagement questionnaire for existing leads',
          category: 'Follow-up',
          questions: createFollowUpTemplate()
        }
      ];

      return {
        onboardingQuestionnaires,
        followUpQuestionnaires,
        totalQuestions,
        activeVersions,
        templates
      };
    } catch (error) {
      console.error('Error fetching questionnaire configs:', error);
      
      // Return default configuration on error
      return createDefaultQuestionnaires();
    }
  }
);

// Create default questionnaires if none exist
function createDefaultQuestionnaires(): QuestionnaireConfigData {
  const defaultOnboarding: QuestionnaireVersion = {
    id: 'default-onboarding',
    name: 'Default Onboarding Questionnaire',
    description: 'Standard lead qualification questionnaire',
    version: 1,
    isActive: true,
    type: 'onboarding',
    questions: createBasicLeadQualificationTemplate(),
    settings: {
      allowEdit: true,
      showProgress: true,
      enableSaveProgress: true,
      completionMessage: 'Thank you for completing our questionnaire!'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const defaultFollowUp: QuestionnaireVersion = {
    id: 'default-follow-up',
    name: 'Default Follow-up Questionnaire',
    description: 'Follow-up questionnaire for existing leads',
    version: 1,
    isActive: true,
    type: 'follow_up',
    questions: createFollowUpTemplate(),
    settings: {
      allowEdit: true,
      showProgress: true,
      enableSaveProgress: true,
      completionMessage: 'Thank you for your continued interest!'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    onboardingQuestionnaires: [defaultOnboarding],
    followUpQuestionnaires: [defaultFollowUp],
    totalQuestions: defaultOnboarding.questions.length + defaultFollowUp.questions.length,
    activeVersions: 2,
    templates: [
      {
        id: 'basic-lead-qualification',
        name: 'Basic Lead Qualification',
        description: 'Standard lead qualification questions',
        category: 'Business',
        questions: createBasicLeadQualificationTemplate()
      }
    ]
  };
}

function createBasicLeadQualificationTemplate(): QuestionConfig[] {
  return [
    {
      id: 'contact-name',
      type: 'text',
      question: 'What is your full name?',
      placeholder: 'Enter your full name',
      required: true,
      category: 'Contact Information',
      order: 1
    },
    {
      id: 'contact-email',
      type: 'email',
      question: 'What is your business email address?',
      placeholder: 'name@company.com',
      required: true,
      validation: {
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
        message: 'Please enter a valid email address'
      },
      category: 'Contact Information',
      order: 2
    },
    {
      id: 'company-name',
      type: 'text',
      question: 'What is your company name?',
      placeholder: 'Enter your company name',
      required: true,
      category: 'Business Information',
      order: 3
    },
    {
      id: 'company-size',
      type: 'select',
      question: 'What is your company size?',
      required: true,
      options: ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'],
      category: 'Business Information',
      order: 4
    },
    {
      id: 'job-title',
      type: 'text',
      question: 'What is your job title?',
      placeholder: 'e.g., CEO, Marketing Director, Operations Manager',
      required: true,
      category: 'Contact Information',
      order: 5
    },
    {
      id: 'industry',
      type: 'select',
      question: 'What industry is your company in?',
      required: true,
      options: [
        'Technology',
        'Healthcare',
        'Finance',
        'Manufacturing',
        'Retail',
        'Education',
        'Real Estate',
        'Professional Services',
        'Other'
      ],
      category: 'Business Information',
      order: 6
    },
    {
      id: 'current-challenges',
      type: 'checkbox',
      question: 'What are your main business challenges? (Select all that apply)',
      required: false,
      options: [
        'Lead generation',
        'Customer retention',
        'Process automation',
        'Data management',
        'Team productivity',
        'Cost reduction',
        'Market expansion',
        'Technology adoption'
      ],
      category: 'Business Needs',
      order: 7
    },
    {
      id: 'budget-range',
      type: 'radio',
      question: 'What is your approximate budget for business solutions?',
      required: false,
      options: [
        'Under $1,000/month',
        '$1,000 - $5,000/month',
        '$5,000 - $10,000/month',
        '$10,000 - $25,000/month',
        'Over $25,000/month',
        'Not sure yet'
      ],
      category: 'Budget Information',
      order: 8
    },
    {
      id: 'timeline',
      type: 'select',
      question: 'When are you looking to implement a solution?',
      required: true,
      options: [
        'Immediately (within 1 month)',
        'Soon (1-3 months)',
        'This quarter (3-6 months)',
        'Later this year (6-12 months)',
        'Just researching for now'
      ],
      category: 'Project Timeline',
      order: 9
    },
    {
      id: 'additional-comments',
      type: 'textarea',
      question: 'Is there anything else you\'d like us to know about your business or needs?',
      placeholder: 'Please share any additional details that would help us better understand your requirements...',
      required: false,
      validation: {
        max: 500,
        message: 'Please keep your response under 500 characters'
      },
      category: 'Additional Information',
      order: 10
    }
  ];
}

function createDetailedBusinessTemplate(): QuestionConfig[] {
  return [
    ...createBasicLeadQualificationTemplate(),
    {
      id: 'annual-revenue',
      type: 'select',
      question: 'What is your company\'s annual revenue?',
      required: false,
      options: [
        'Under $100K',
        '$100K - $500K',
        '$500K - $1M',
        '$1M - $5M',
        '$5M - $10M',
        'Over $10M',
        'Prefer not to say'
      ],
      category: 'Business Information',
      order: 11
    },
    {
      id: 'decision-maker',
      type: 'radio',
      question: 'Are you the primary decision maker for this type of purchase?',
      required: true,
      options: ['Yes, I make the final decision', 'I influence the decision', 'I gather information for others', 'Not sure'],
      category: 'Decision Making',
      order: 12
    }
  ];
}

function createServiceInterestTemplate(): QuestionConfig[] {
  return [
    {
      id: 'service-interest',
      type: 'checkbox',
      question: 'Which services are you most interested in?',
      required: true,
      options: [
        'Lead Generation',
        'Marketing Automation',
        'CRM Implementation',
        'Sales Training',
        'Process Optimization',
        'Data Analytics',
        'Customer Support',
        'Custom Development'
      ],
      category: 'Service Interest',
      order: 1
    },
    {
      id: 'current-tools',
      type: 'textarea',
      question: 'What tools or systems are you currently using?',
      placeholder: 'List your current CRM, marketing tools, etc.',
      required: false,
      category: 'Current Setup',
      order: 2
    }
  ];
}

function createFollowUpTemplate(): QuestionConfig[] {
  return [
    {
      id: 'followup-interest',
      type: 'radio',
      question: 'How would you rate your current interest in our services?',
      required: true,
      options: [
        'Very interested - ready to move forward',
        'Interested - need more information',
        'Somewhat interested - still evaluating',
        'Not interested at this time'
      ],
      category: 'Interest Level',
      order: 1
    },
    {
      id: 'timeline-update',
      type: 'select',
      question: 'Has your timeline for implementation changed?',
      required: true,
      options: [
        'No change - still on original timeline',
        'Moved up - need solution sooner',
        'Delayed - timeline pushed back',
        'Indefinitely postponed',
        'Already implemented another solution'
      ],
      category: 'Timeline Update',
      order: 2
    },
    {
      id: 'main-concerns',
      type: 'checkbox',
      question: 'What are your main concerns or questions?',
      required: false,
      options: [
        'Pricing and costs',
        'Implementation timeline',
        'Technical requirements',
        'Team training needs',
        'Integration with current systems',
        'ROI and results',
        'Ongoing support'
      ],
      category: 'Concerns',
      order: 3
    }
  ];
}