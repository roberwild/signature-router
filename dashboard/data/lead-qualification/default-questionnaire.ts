export interface QuestionOption {
  value: string;
  label: string;
  service?: string;
  score?: number;
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text' | 'text_area';
  required: boolean;
  question: string;
  options?: QuestionOption[];
  allow_other?: boolean;
  scoring_weight?: Record<string, number>;
  placeholder?: string;
  maxLength?: number;
}

export interface QuestionnaireConfig {
  version: number;
  questions: Question[];
  extended_questionnaires?: {
    follow_up_qualified: string[];
    technical_assessment: string[];
    compliance_deep_dive: string[];
  };
  scoring: {
    thresholds: {
      A1: number;
      B1: number;
      C1: number;
      D1: number;
    };
    components: {
      urgency: number;
      budget: number;
      fit: number;
      engagement: number;
      decision: number;
    };
    text_engagement_bonus?: {
      has_text: number;
      over_50_chars: number;
      over_200_chars: number;
      keywords: Record<string, number>;
    };
  };
  ui: {
    progress_bar: boolean;
    skip_optional_button: boolean;
    auto_save: boolean;
    time_tracking: boolean;
    one_question_per_page: boolean;
  };
}

export const defaultQuestionnaire: QuestionnaireConfig = {
  version: 2, // Updated version for new structure
  questions: [
    // Core Required Questions (1-5 + timeline)
    {
      id: "recent_incidents",
      type: "single_choice",
      required: true,
      question: "¿Has tenido incidentes de ciberseguridad en los últimos 12 meses?",
      options: [
        { value: "urgent", label: "Sí, y necesitamos ayuda urgente", score: 35 },
        { value: "resolved", label: "Sí, pero ya lo resolvimos", score: 20 },
        { value: "preventive", label: "No, pero queremos prevenirlo", score: 10 },
        { value: "unsure", label: "No estoy seguro", score: 5 }
      ],
      scoring_weight: { urgency: 0.35 }
    },
    {
      id: "main_concern",
      type: "single_choice",
      required: true,
      question: "¿Cuál es tu principal preocupación en ciberseguridad?",
      options: [
        { value: "security_level", label: "No sé mi nivel actual de seguridad", service: "maturity_analysis" },
        { value: "vulnerabilities", label: "Quiero verificar vulnerabilidades", service: "pentest" },
        { value: "no_team", label: "No tengo equipo de seguridad", service: "virtual_ciso" },
        { value: "incident_response", label: "Necesito respuesta ante incidentes", service: "forensic_analysis" }
      ],
      scoring_weight: { urgency: 0.20, fit: 0.35 }
    },
    {
      id: "company_size",
      type: "single_choice",
      required: true,
      question: "¿Cuál es el tamaño de tu empresa?",
      options: [
        { value: "1-10", label: "1-10 empleados", score: 10 },
        { value: "11-50", label: "11-50 empleados", score: 15 },
        { value: "51-200", label: "51-200 empleados", score: 20 },
        { value: "200+", label: "+200 empleados", score: 25 }
      ],
      scoring_weight: { budget: 0.25 }
    },
    {
      id: "implementation_timeline",
      type: "single_choice",
      required: true,
      question: "¿Cuándo planeas implementar mejoras de seguridad?",
      options: [
        { value: "immediate", label: "Inmediatamente (este mes)", score: 30 },
        { value: "quarter", label: "Este trimestre", score: 20 },
        { value: "year", label: "Este año", score: 10 },
        { value: "exploring", label: "Solo estoy explorando opciones", score: 5 }
      ],
      scoring_weight: { urgency: 0.25, engagement: 0.10 }
    },
    {
      id: "compliance",
      type: "multiple_choice",
      required: true,
      question: "¿Qué requerimientos de cumplimiento normativo tienes?",
      options: [
        { value: "gdpr", label: "GDPR / LOPD" },
        { value: "iso27001", label: "ISO 27001" },
        { value: "ens", label: "ENS (Esquema Nacional de Seguridad)" },
        { value: "nis2", label: "NIS-2" },
        { value: "pci", label: "PCI-DSS" },
        { value: "none", label: "Ninguno / No lo sé" }
      ],
      allow_other: true,
      scoring_weight: { fit: 0.20 }
    },
    // Final open text question (required for engagement scoring)
    {
      id: "specific_needs",
      type: "text_area",
      required: false, // Optional but highly valued for scoring
      question: "¿Tienes alguna necesidad específica o proyecto de ciberseguridad en mente?",
      placeholder: "Cuéntanos más sobre tu situación actual o lo que necesitas...",
      maxLength: 500,
      scoring_weight: { engagement: 0.15 } // High weight for those who write
    },

    // Future/Extended Questions (can be sent in follow-up questionnaires)
    // These are stored but not shown in initial onboarding
    /* Extended questions for future use:
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
      id: "work_model",
      type: "single_choice",
      required: false,
      question: "¿Cuál es tu modelo de trabajo?",
      options: [
        { value: "remote", label: "100% remoto" },
        { value: "hybrid", label: "Híbrido (remoto y presencial)" },
        { value: "office", label: "100% presencial" }
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
      id: "main_concern_attack",
      type: "single_choice",
      required: false,
      question: "¿Qué te preocupa más ante un posible ciberataque?",
      options: [
        { value: "data_loss", label: "Pérdida de datos" },
        { value: "reputation", label: "Daño reputacional" },
        { value: "financial", label: "Pérdidas económicas" },
        { value: "operations", label: "Interrupción del negocio" },
        { value: "legal", label: "Sanciones legales/regulatorias" }
      ],
      scoring_weight: { engagement: 0.01 }
    },
    {
      id: "contact_preference",
      type: "single_choice",
      required: false,
      question: "¿Cómo prefieres que te contactemos?",
      options: [
        { value: "phone", label: "Llamada telefónica" },
        { value: "email", label: "Email" },
        { value: "whatsapp", label: "WhatsApp" },
        { value: "video", label: "Videollamada" }
      ]
    },
    {
      id: "contact_time",
      type: "single_choice",
      required: false,
      question: "¿Cuál es el mejor horario para contactarte?",
      options: [
        { value: "morning", label: "Mañana (9:00 - 13:00)" },
        { value: "afternoon", label: "Tarde (13:00 - 17:00)" },
        { value: "evening", label: "Tarde-noche (17:00 - 20:00)" },
        { value: "anytime", label: "Cualquier horario" }
      ]
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
      id: "implementation_timeline",
      type: "single_choice",
      required: false,
      question: "¿Cuándo planeas implementar mejoras de seguridad?",
      options: [
        { value: "immediate", label: "Inmediatamente (este mes)", score: 10 },
        { value: "quarter", label: "Este trimestre", score: 7 },
        { value: "year", label: "Este año", score: 4 },
        { value: "exploring", label: "Solo estoy explorando opciones", score: 1 }
      ],
      scoring_weight: { urgency: 0.15, engagement: 0.02 }
    },
    {
      id: "previous_experience",
      type: "single_choice",
      required: false,
      question: "¿Has trabajado antes con consultoras de ciberseguridad?",
      options: [
        { value: "satisfied", label: "Sí, con buenos resultados" },
        { value: "mixed", label: "Sí, con resultados mixtos" },
        { value: "unsatisfied", label: "Sí, pero no quedamos satisfechos" },
        { value: "never", label: "No, sería la primera vez" }
      ],
      scoring_weight: { engagement: 0.01 }
    }
    */ // End of extended questions - uncomment to enable
  ],
  
  // Support for future questionnaires
  extended_questionnaires: {
    follow_up_qualified: [
      "it_team", "sector", "sensitive_data", "security_budget", 
      "decision_capacity", "role"
    ],
    technical_assessment: [
      "critical_systems", "backup_status", "mfa_status", 
      "incident_plan", "security_training"
    ],
    compliance_deep_dive: [
      "third_parties", "work_model", "previous_audits", 
      "cyber_insurance", "critical_users"
    ]
  },
  
  scoring: {
    thresholds: {
      A1: 80,  // Hot lead - Contact immediately (adjusted for 6 questions)
      B1: 55,  // Warm lead - Contact within 24h
      C1: 30,  // Cold lead - Nurturing campaign
      D1: 0    // Info seeker - Newsletter only
    },
    components: {
      urgency: 0.40,   // 40% - Recent incidents + timeline (increased)
      budget: 0.25,    // 25% - Company size
      fit: 0.25,       // 25% - Service match, compliance needs (increased)
      engagement: 0.10, // 10% - Free text completion
      decision: 0.00   // 0% - Will be assessed in follow-up
    },
    // Bonus scoring for free text
    text_engagement_bonus: {
      has_text: 10,        // Base bonus for writing anything
      over_50_chars: 15,   // Bonus for substantial text
      over_200_chars: 20,  // Bonus for detailed text
      keywords: {          // Extra points for mentioning key terms
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
      }
    }
  },
  
  ui: {
    progress_bar: true,
    skip_optional_button: true,
    auto_save: true,
    time_tracking: true,
    one_question_per_page: true
  }
};