/**
 * Lead Qualification Schema
 * Validation schema for lead qualification forms
 */

import { z } from 'zod';

export const leadQualificationSchema = z.object({
  mainConcern: z.enum([
    'security_level',
    'vulnerabilities',
    'no_team',
    'incident_response',
  ]),
  complianceRequirements: z.array(z.string()).min(1, 'Selecciona al menos un requisito'),
  complianceOther: z.string().optional(),
  itTeamSize: z.enum(['dedicated', 'small', 'external', 'none']),
  companySize: z.enum(['1-10', '11-50', '51-200', '200+']),
  recentIncidents: z.enum(['urgent', 'resolved', 'preventive', 'unsure']),
  
  // Optional questions
  sector: z.string().optional(),
  role: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  
  // Open text
  specificNeeds: z.string().optional(),
});

export type LeadQualificationInput = z.infer<typeof leadQualificationSchema>;

// Lead scoring thresholds
export const LEAD_CLASSIFICATION_THRESHOLDS = {
  A1: 85, // Hot lead
  B1: 60, // Warm lead
  C1: 30, // Cold lead
  D1: 0,  // Info seeker
} as const;

export type LeadClassification = keyof typeof LEAD_CLASSIFICATION_THRESHOLDS;

