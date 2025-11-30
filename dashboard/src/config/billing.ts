/**
 * Billing configuration for the Incident Registry and Assessment platform
 */

export const BILLING_CONFIG = {
  // Product IDs (these need to be created in Stripe Dashboard)
  products: {
    incidentRegistry: {
      id: process.env.BILLING_INCIDENT_REGISTRY_PRODUCT_ID || 'prod_incident_registry',
      name: 'Registro de Incidentes de Ciberseguridad',
      description: 'Cumple con la obligación legal de mantener un registro de incidentes según AEPD (RGPD Art. 33)',
      features: [
        'Registro ilimitado de incidentes',
        'Versionado y trazabilidad completa',
        'Tokens únicos para cada versión',
        'Portal público de verificación',
        'Campos obligatorios AEPD',
        'Notificaciones y recordatorios',
        'Exportación de datos',
      ],
    },
  },

  // Pricing plans
  plans: {
    monthly: {
      id: process.env.BILLING_INCIDENT_MONTHLY_PRICE_ID || 'price_incident_monthly',
      amount: 399, // 3.99 EUR in cents
      currency: 'eur',
      interval: 'month' as const,
      name: 'Mensual',
      description: '3,99 € al mes',
    },
    annual: {
      id: process.env.BILLING_INCIDENT_ANNUAL_PRICE_ID || 'price_incident_annual',
      amount: 3999, // 39.99 EUR in cents
      currency: 'eur',
      interval: 'year' as const,
      name: 'Anual',
      description: '39,99 € al año (ahorra 8 €)',
      savings: '17% de descuento',
    },
    triennial: {
      id: process.env.BILLING_INCIDENT_TRIENNIAL_PRICE_ID || 'price_incident_triennial',
      amount: 9999, // 99.99 EUR in cents
      currency: 'eur',
      interval: 'year' as const,
      intervalCount: 3,
      name: 'Trienal',
      description: '99,99 € por 3 años (ahorra 44 €)',
      savings: '31% de descuento',
    },
  },

  // Free features
  freeFeatures: {
    assessment: {
      name: 'Test de Ciberseguridad',
      description: 'Descubre en menos de 5 minutos si tu empresa está preparada para enfrentar amenazas digitales',
      features: [
        '100% gratuito, sin registros',
        'Rápido: solo 5 minutos',
        'Resultados al instante',
        'Fácil y sin tecnicismos',
        'Informe detallado con nivel de riesgo',
        'Recomendaciones personalizadas',
        'Histórico de resultados',
        'Comparación con media global',
      ],
    },
  },

  // Future products (for roadmap)
  futureProducts: {
    cis18: {
      name: 'CIS-18 Controls',
      description: 'Evaluación completa de controles CIS',
      comingSoon: true,
    },
    auditoria: {
      name: 'Auditoría Externa',
      description: 'Servicio de auditoría profesional',
      comingSoon: true,
    },
    pentest: {
      name: 'Pentesting',
      description: 'Pruebas de penetración profesionales',
      comingSoon: true,
    },
  },

  // Billing settings
  settings: {
    billingUnit: 'per_organization' as const, // Billing is per organization, not per seat
    trialDays: 0, // No trial period - assessment is free, incidents are paid
    currency: 'eur',
    locale: 'es-ES',
  },
};

/**
 * Check if a feature requires premium subscription
 */
export function requiresPremium(feature: 'incidents' | 'assessment'): boolean {
  return feature === 'incidents';
}

/**
 * Get pricing display for UI
 */
export function getPricingDisplay() {
  const { plans } = BILLING_CONFIG;
  
  return {
    monthly: {
      ...plans.monthly,
      displayPrice: '3,99 €',
      period: 'mes',
    },
    annual: {
      ...plans.annual,
      displayPrice: '39,99 €',
      period: 'año',
      monthlyEquivalent: '3,33 €/mes',
    },
    triennial: {
      ...plans.triennial,
      displayPrice: '99,99 €',
      period: '3 años',
      monthlyEquivalent: '2,78 €/mes',
    },
  };
}

/**
 * Calculate savings for annual and triennial plans
 */
export function calculateSavings(plan: 'annual' | 'triennial'): number {
  const monthlyTotal = BILLING_CONFIG.plans.monthly.amount * 12;
  
  if (plan === 'annual') {
    return monthlyTotal - BILLING_CONFIG.plans.annual.amount;
  }
  
  if (plan === 'triennial') {
    const threeYearMonthly = BILLING_CONFIG.plans.monthly.amount * 36;
    return threeYearMonthly - BILLING_CONFIG.plans.triennial.amount;
  }
  
  return 0;
}