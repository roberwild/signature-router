/**
 * Extended Questionnaires for Lead Qualification
 * These can be sent as follow-up forms to gather more information
 * about qualified leads without overwhelming them initially.
 */

import type { Question } from './default-questionnaire';

// Follow-up questionnaire for qualified leads (B1 and above)
export const qualifiedLeadFollowUp: Question[] = [
  {
    id: "it_team",
    type: "single_choice",
    required: false,
    question: "¿Tienes equipo IT interno?",
    options: [
      { value: "dedicated", label: "Sí, equipo dedicado de IT", score: 5 },
      { value: "small", label: "Sí, pero solo 1-2 personas", score: 3 },
      { value: "external", label: "No, lo gestionamos externamente", score: 2 },
      { value: "none", label: "No tenemos equipo IT", score: 1 }
    ],
    scoring_weight: { decision: 0.10 }
  },
  {
    id: "sector",
    type: "single_choice",
    required: false,
    question: "¿En qué sector opera tu empresa?",
    options: [
      { value: "finance", label: "Finanzas / Banca" },
      { value: "health", label: "Salud / Farmacéutica" },
      { value: "retail", label: "Retail / E-commerce" },
      { value: "tech", label: "Tecnología / Software" },
      { value: "manufacturing", label: "Manufactura / Industria" },
      { value: "education", label: "Educación" },
      { value: "government", label: "Gobierno / Sector Público" },
      { value: "other", label: "Otro" }
    ],
    scoring_weight: { engagement: 0.02 }
  },
  {
    id: "security_budget",
    type: "single_choice",
    required: false,
    question: "¿Cuál es tu presupuesto anual aproximado para ciberseguridad?",
    options: [
      { value: "none", label: "No tenemos presupuesto asignado", score: 0 },
      { value: "under_10k", label: "Menos de 10.000€", score: 5 },
      { value: "10k_50k", label: "10.000€ - 50.000€", score: 10 },
      { value: "50k_100k", label: "50.000€ - 100.000€", score: 15 },
      { value: "over_100k", label: "Más de 100.000€", score: 20 }
    ],
    scoring_weight: { budget: 0.15, engagement: 0.02 }
  },
  {
    id: "decision_capacity",
    type: "single_choice",
    required: false,
    question: "¿Tienes capacidad de decisión sobre contrataciones de seguridad?",
    options: [
      { value: "full", label: "Sí, decido directamente", score: 10 },
      { value: "influence", label: "Influyo en la decisión", score: 7 },
      { value: "recommend", label: "Hago recomendaciones", score: 4 },
      { value: "none", label: "No participo en decisiones", score: 1 }
    ],
    scoring_weight: { decision: 0.10 }
  },
  {
    id: "role",
    type: "single_choice",
    required: false,
    question: "¿Cuál es tu rol en la empresa?",
    options: [
      { value: "ceo", label: "CEO / Director General", score: 10 },
      { value: "cto", label: "CTO / Director de Tecnología", score: 10 },
      { value: "ciso", label: "CISO / Responsable de Seguridad", score: 10 },
      { value: "it_manager", label: "IT Manager / Responsable IT", score: 8 },
      { value: "other_manager", label: "Otro cargo directivo", score: 5 },
      { value: "technical", label: "Técnico / Especialista", score: 3 },
      { value: "other", label: "Otro", score: 1 }
    ],
    scoring_weight: { decision: 0.10 }
  }
];

// Technical assessment questionnaire (for technical evaluation)
export const technicalAssessment: Question[] = [
  {
    id: "critical_systems",
    type: "multiple_choice",
    required: false,
    question: "¿Qué sistemas críticos utilizas?",
    options: [
      { value: "erp", label: "ERP (SAP, Oracle, etc.)" },
      { value: "crm", label: "CRM (Salesforce, HubSpot, etc.)" },
      { value: "cloud", label: "Servicios en la nube (AWS, Azure, Google Cloud)" },
      { value: "databases", label: "Bases de datos críticas" },
      { value: "ecommerce", label: "Plataforma de e-commerce" },
      { value: "custom", label: "Aplicaciones propias/personalizadas" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "backup_status",
    type: "single_choice",
    required: false,
    question: "¿Cuál es el estado de tus copias de seguridad?",
    options: [
      { value: "automated", label: "Automatizadas y probadas regularmente" },
      { value: "automated_not_tested", label: "Automatizadas pero no probadas" },
      { value: "manual", label: "Manuales y ocasionales" },
      { value: "none", label: "No tenemos sistema de backups" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "mfa_status",
    type: "single_choice",
    required: false,
    question: "¿Usas autenticación multifactor (MFA)?",
    options: [
      { value: "all", label: "Sí, en todos los sistemas críticos" },
      { value: "some", label: "Sí, en algunos sistemas" },
      { value: "planning", label: "No, pero lo estamos planificando" },
      { value: "none", label: "No usamos MFA" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "incident_plan",
    type: "single_choice",
    required: false,
    question: "¿Tienes un plan de respuesta ante incidentes?",
    options: [
      { value: "tested", label: "Sí, documentado y probado" },
      { value: "documented", label: "Sí, pero nunca lo hemos probado" },
      { value: "informal", label: "Tenemos procedimientos informales" },
      { value: "none", label: "No tenemos plan" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "security_training",
    type: "single_choice",
    required: false,
    question: "¿Proporcionas formación en ciberseguridad a tus empleados?",
    options: [
      { value: "regular", label: "Sí, regularmente (mensual/trimestral)" },
      { value: "annual", label: "Sí, anualmente" },
      { value: "onboarding", label: "Solo en el onboarding" },
      { value: "none", label: "No proporcionamos formación" }
    ],
    scoring_weight: { engagement: 0.01 }
  }
];

// Compliance deep dive questionnaire
export const complianceDeepDive: Question[] = [
  {
    id: "sensitive_data",
    type: "multiple_choice",
    required: false,
    question: "¿Qué tipo de datos sensibles manejas?",
    options: [
      { value: "personal", label: "Datos personales de clientes" },
      { value: "financial", label: "Información financiera" },
      { value: "health", label: "Datos de salud" },
      { value: "intellectual", label: "Propiedad intelectual" },
      { value: "government", label: "Información gubernamental" },
      { value: "none", label: "No manejamos datos sensibles" }
    ],
    scoring_weight: { engagement: 0.02 }
  },
  {
    id: "third_parties",
    type: "single_choice",
    required: false,
    question: "¿Trabajas con proveedores o terceros que acceden a tus sistemas?",
    options: [
      { value: "many", label: "Sí, más de 10 proveedores" },
      { value: "some", label: "Sí, entre 3-10 proveedores" },
      { value: "few", label: "Sí, 1-2 proveedores" },
      { value: "none", label: "No trabajamos con terceros" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "previous_audits",
    type: "single_choice",
    required: false,
    question: "¿Has realizado auditorías de seguridad previamente?",
    options: [
      { value: "never", label: "Nunca" },
      { value: "over_2_years", label: "Hace más de 2 años" },
      { value: "last_year", label: "En el último año" },
      { value: "recently", label: "En los últimos 6 meses" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "cyber_insurance",
    type: "single_choice",
    required: false,
    question: "¿Tienes seguro de ciberriesgos?",
    options: [
      { value: "comprehensive", label: "Sí, con cobertura completa" },
      { value: "basic", label: "Sí, con cobertura básica" },
      { value: "considering", label: "Lo estamos considerando" },
      { value: "none", label: "No tenemos seguro" }
    ],
    scoring_weight: { engagement: 0.01 }
  },
  {
    id: "critical_users",
    type: "single_choice",
    required: false,
    question: "¿Cuántos usuarios tienen acceso a sistemas críticos?",
    options: [
      { value: "under_5", label: "Menos de 5" },
      { value: "5_20", label: "Entre 5 y 20" },
      { value: "20_50", label: "Entre 20 y 50" },
      { value: "over_50", label: "Más de 50" }
    ],
    scoring_weight: { engagement: 0.01 }
  }
];

/**
 * Function to get the appropriate follow-up questionnaire based on lead score
 */
export function getFollowUpQuestionnaire(leadScore: number, _responses: Record<string, unknown>) {
  // A1 leads (80+): Get detailed budget and decision info
  if (leadScore >= 80) {
    return qualifiedLeadFollowUp;
  }
  
  // B1 leads (55-79): Get technical assessment
  if (leadScore >= 55) {
    return technicalAssessment;
  }
  
  // C1 leads (30-54): Get compliance info for nurturing
  if (leadScore >= 30) {
    return complianceDeepDive;
  }
  
  // D1 leads: No follow-up needed
  return [];
}

/**
 * Function to merge responses from multiple questionnaires
 */
export function mergeLeadResponses(
  initialResponses: Record<string, unknown>,
  followUpResponses: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...initialResponses,
    ...followUpResponses,
    _metadata: {
      hasFollowUp: true,
      followUpDate: new Date().toISOString(),
      questionnairesCompleted: 2
    }
  };
}