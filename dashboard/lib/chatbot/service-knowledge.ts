export const MINERY_SERVICES_KNOWLEDGE = {
  company: {
    name: "Minery",
    description: "Plataforma líder en ciberseguridad empresarial",
    mission: "Proteger y fortalecer la seguridad digital de las organizaciones",
    contact: {
      whatsapp: "https://wa.me/message/C35F4AFPXDNUK1",
      email: "servicios@minery.io"
    }
  },
  
  services: [
    {
      id: 'maturity-analysis',
      name: 'Análisis de Madurez en Ciberseguridad',
      category: 'assessment',
      description: 'Evaluación exhaustiva del nivel de madurez en ciberseguridad de tu organización',
      detailedDescription: `
        Nuestro análisis de madurez proporciona una visión completa de las capacidades actuales 
        de ciberseguridad de tu organización. Utilizamos frameworks reconocidos como NIST y CIS 
        para evaluar tu posición actual y crear un roadmap personalizado de mejora.
      `,
      benefits: [
        'Identificación de brechas críticas de seguridad',
        'Benchmarking contra estándares de la industria',
        'Roadmap priorizado de 6-12 meses',
        'Informe ejecutivo para la alta dirección',
        'Recomendaciones específicas y accionables'
      ],
      process: [
        'Entrevistas con stakeholders clave',
        'Revisión de documentación y políticas',
        'Análisis técnico de controles',
        'Evaluación de procesos y procedimientos',
        'Informe detallado con plan de acción'
      ],
      duration: '2-3 semanas',
      pricing: 'Desde $5,000 USD (solicitar cotización personalizada)',
      ideal_for: 'Empresas medianas y grandes que buscan mejorar sistemáticamente su postura de seguridad',
      deliverables: [
        'Informe de madurez detallado',
        'Matriz de riesgos priorizada',
        'Roadmap de implementación',
        'Presentación ejecutiva'
      ]
    },
    {
      id: 'pen-test',
      name: 'Pruebas de Penetración (Pentest)',
      category: 'testing',
      description: 'Simulación de ataques reales para identificar vulnerabilidades explotables',
      detailedDescription: `
        Las pruebas de penetración simulan ataques reales de hackers para descubrir 
        vulnerabilidades antes que los ciberdelincuentes. Nuestro equipo certificado 
        utiliza las mismas técnicas y herramientas que los atacantes reales.
      `,
      types: [
        'Pentest de Infraestructura Externa',
        'Pentest de Infraestructura Interna',
        'Pentest de Aplicaciones Web',
        'Pentest de Aplicaciones Móviles',
        'Pentest de Ingeniería Social'
      ],
      benefits: [
        'Identificación de vulnerabilidades críticas',
        'Validación de controles de seguridad',
        'Cumplimiento regulatorio (PCI-DSS, ISO 27001)',
        'Reducción del riesgo de brechas',
        'Evidencia para auditorías'
      ],
      process: [
        'Definición del alcance',
        'Reconocimiento y enumeración',
        'Identificación de vulnerabilidades',
        'Explotación controlada',
        'Post-explotación y análisis',
        'Informe y remediación'
      ],
      duration: '1-4 semanas según el alcance',
      pricing: 'Desde $8,000 USD (varía según alcance)',
      ideal_for: 'Organizaciones con activos digitales críticos, aplicaciones web públicas, o requisitos de cumplimiento',
      deliverables: [
        'Informe técnico detallado',
        'Informe ejecutivo',
        'Evidencias de vulnerabilidades',
        'Guía de remediación'
      ]
    },
    {
      id: 'managed-security',
      name: 'Departamento Externalizado de Ciberseguridad',
      category: 'managed',
      description: 'Tu equipo completo de seguridad gestionado externamente',
      detailedDescription: `
        Proporcionamos un departamento completo de ciberseguridad que actúa como 
        una extensión de tu organización. Incluye SOC 24/7, gestión de incidentes, 
        cumplimiento normativo y más, sin el costo de mantener un equipo interno.
      `,
      services_included: [
        'Centro de Operaciones de Seguridad (SOC) 24/7',
        'Monitoreo continuo de amenazas',
        'Respuesta a incidentes',
        'Gestión de vulnerabilidades',
        'Cumplimiento regulatorio',
        'Reportes mensuales y trimestrales',
        'Asesoría continua en seguridad'
      ],
      benefits: [
        'Reducción de costos vs equipo interno (hasta 60%)',
        'Expertise especializado inmediato',
        'Cobertura 24/7/365',
        'Escalabilidad según necesidades',
        'Tecnología de punta incluida',
        'Sin costos de capacitación'
      ],
      sla: {
        'Detección de incidentes': '< 15 minutos',
        'Respuesta inicial': '< 30 minutos',
        'Contención': '< 2 horas',
        'Disponibilidad del servicio': '99.9%'
      },
      duration: 'Contrato anual con revisiones trimestrales',
      pricing: 'Desde $8,000 USD/mes (basado en tamaño y complejidad)',
      ideal_for: 'Empresas sin equipo de seguridad interno o que buscan fortalecer sus capacidades existentes',
      deliverables: [
        'Portal de monitoreo en tiempo real',
        'Reportes mensuales de actividad',
        'Análisis trimestral de tendencias',
        'Recomendaciones de mejora continua'
      ]
    },
    {
      id: 'ciso-service',
      name: 'CISO as a Service (CISOaaS)',
      category: 'managed',
      description: 'Director de Seguridad virtual para tu organización',
      detailedDescription: `
        Obtén acceso a un CISO experimentado sin el costo de un ejecutivo a tiempo 
        completo. Nuestros CISOs virtuales tienen más de 10 años de experiencia 
        liderando programas de seguridad en empresas Fortune 500.
      `,
      responsibilities: [
        'Desarrollo de estrategia de seguridad',
        'Gobierno y gestión de riesgos',
        'Presentaciones al board y comité directivo',
        'Gestión del presupuesto de seguridad',
        'Liderazgo del equipo de seguridad',
        'Gestión de proveedores de seguridad',
        'Cumplimiento regulatorio'
      ],
      benefits: [
        'Expertise ejecutivo sin costo completo',
        'Visión estratégica experimentada',
        'Credibilidad ante el board',
        'Flexibilidad de dedicación',
        'Red de contactos en la industria',
        'Mejores prácticas probadas'
      ],
      engagement_models: [
        'Part-time (2-3 días/semana)',
        'Advisory (1 día/semana)',
        'On-demand (por proyecto)'
      ],
      duration: 'Mínimo 6 meses, renovable',
      pricing: 'Desde $5,000 USD/mes (modelo advisory)',
      ideal_for: 'Empresas en crecimiento, startups financiadas, o organizaciones en transformación digital',
      deliverables: [
        'Estrategia de seguridad documentada',
        'Políticas y procedimientos',
        'Reportes ejecutivos mensuales',
        'Métricas y KPIs de seguridad'
      ]
    },
    {
      id: 'forensic-analysis',
      name: 'Análisis Forense Digital',
      category: 'incident',
      description: 'Investigación profunda de incidentes de seguridad',
      detailedDescription: `
        Cuando ocurre un incidente, nuestro equipo forense determina exactamente 
        qué sucedió, cómo sucedió, y qué información fue comprometida. Utilizamos 
        técnicas avanzadas de forensia digital admisibles en procesos legales.
      `,
      capabilities: [
        'Forensia de sistemas Windows/Linux/Mac',
        'Análisis de memoria RAM',
        'Recuperación de datos eliminados',
        'Análisis de malware',
        'Forensia de dispositivos móviles',
        'Forensia de red',
        'Forensia de cloud'
      ],
      use_cases: [
        'Brechas de seguridad',
        'Ransomware',
        'Fraude interno',
        'Fuga de información',
        'Disputas legales',
        'Cumplimiento regulatorio'
      ],
      process: [
        'Preservación de evidencia',
        'Adquisición forense',
        'Análisis técnico',
        'Reconstrucción de eventos',
        'Documentación legal',
        'Testimonio experto (si requiere)'
      ],
      duration: '1-2 semanas para casos estándar',
      pricing: 'Desde $15,000 USD por investigación',
      ideal_for: 'Organizaciones que han sufrido un incidente o necesitan evidencia para procesos legales',
      deliverables: [
        'Cadena de custodia documentada',
        'Informe forense detallado',
        'Timeline del incidente',
        'Evidencia preservada',
        'Testimonio experto (opcional)'
      ]
    },
    {
      id: 'incident-response',
      name: 'Respuesta Rápida ante Incidentes',
      category: 'incident',
      description: 'Respuesta de emergencia 24/7 ante incidentes activos',
      detailedDescription: `
        Cuando cada minuto cuenta, nuestro equipo de respuesta rápida está disponible 
        24/7 para contener, erradicar y recuperar de incidentes de seguridad activos. 
        Minimizamos el impacto y el tiempo de inactividad.
      `,
      response_time: {
        'Llamada inicial': '< 15 minutos',
        'Equipo desplegado': '< 1 hora',
        'Contención inicial': '< 4 horas'
      },
      incident_types: [
        'Ransomware',
        'Brechas de datos',
        'Compromiso de email empresarial',
        'Ataques DDoS',
        'Compromiso de infraestructura',
        'Insider threats'
      ],
      phases: [
        'Triaje inicial',
        'Contención del incidente',
        'Erradicación de la amenaza',
        'Recuperación de sistemas',
        'Lecciones aprendidas'
      ],
      duration: 'Según severidad (24h - 2 semanas)',
      pricing: 'Retainer desde $3,000 USD/mes o por incidente desde $25,000 USD',
      ideal_for: 'Cualquier organización que necesite capacidad de respuesta inmediata',
      deliverables: [
        'Contención del incidente',
        'Sistemas restaurados',
        'Informe post-incidente',
        'Recomendaciones de mejora'
      ]
    }
  ],

  faqs: [
    {
      question: "¿Cómo sé qué servicio necesita mi empresa?",
      answer: "Recomendamos comenzar con un Análisis de Madurez para entender tu postura actual de seguridad. Esto nos ayudará a identificar las prioridades y recomendar los servicios más apropiados."
    },
    {
      question: "¿Los servicios incluyen las herramientas de seguridad?",
      answer: "Depende del servicio. Los servicios gestionados como el SOC incluyen las herramientas necesarias. Para otros servicios, podemos trabajar con tus herramientas existentes o recomendar las apropiadas."
    },
    {
      question: "¿Trabajan con empresas pequeñas?",
      answer: "Sí, tenemos soluciones escalables para empresas de todos los tamaños. Podemos adaptar nuestros servicios a tu presupuesto y necesidades específicas."
    },
    {
      question: "¿Qué certificaciones tiene su equipo?",
      answer: "Nuestro equipo cuenta con certificaciones como CISSP, CEH, OSCP, GCIH, GIAC, y experiencia probada en empresas Fortune 500."
    },
    {
      question: "¿Pueden ayudarnos con cumplimiento regulatorio?",
      answer: "Absolutamente. Tenemos experiencia con ISO 27001, PCI-DSS, HIPAA, GDPR, y regulaciones locales. Podemos ayudarte a lograr y mantener el cumplimiento."
    },
    {
      question: "¿Qué sucede si tenemos un incidente activo ahora mismo?",
      answer: "Contáctanos inmediatamente por WhatsApp o teléfono. Tenemos un equipo de respuesta rápida disponible 24/7 para incidentes críticos."
    },
    {
      question: "¿Ofrecen capacitación para nuestro equipo?",
      answer: "Sí, la capacitación y concientización están incluidas en varios de nuestros servicios, y también ofrecemos programas de capacitación personalizados."
    },
    {
      question: "¿Cómo manejan la confidencialidad?",
      answer: "Firmamos NDAs estrictos antes de cualquier engagement. Toda la información se maneja con los más altos estándares de confidencialidad y seguridad."
    }
  ],

  decision_tree: {
    "No tengo equipo de seguridad": ["ciso-service", "managed-security"],
    "Necesito validar mi seguridad": ["pen-test", "maturity-analysis"],
    "Tuve un incidente": ["incident-response", "forensic-analysis"],
    "Necesito cumplir regulaciones": ["maturity-analysis", "ciso-service"],
    "Quiero mejorar mi seguridad": ["maturity-analysis", "managed-security"],
    "Tengo presupuesto limitado": ["maturity-analysis", "ciso-service"],
    "Necesito respuesta 24/7": ["managed-security", "incident-response"]
  }
};

export const CHATBOT_SYSTEM_PROMPT = `
Eres un asesor experto en ciberseguridad de Minery, una plataforma líder en servicios de seguridad empresarial.

Tu misión es:
1. Entender las necesidades de seguridad del usuario
2. Recomendar los servicios más apropiados de Minery
3. Explicar cómo cada servicio puede ayudar específicamente
4. Guiar hacia una solicitud de servicio cuando estén listos

Personalidad:
- Profesional pero accesible
- Experto sin ser condescendiente  
- Proactivo en hacer preguntas de descubrimiento
- Enfocado en soluciones, no en vender

Conocimiento base:
${JSON.stringify(MINERY_SERVICES_KNOWLEDGE, null, 2)}

Reglas importantes:
- Siempre responde en español a menos que el usuario escriba en otro idioma
- No inventes precios específicos más allá de los rangos dados
- Si no conoces algo, sugiere contactar al equipo de ventas
- Mantén las respuestas concisas pero informativas
- Usa bullets o numeración para mejor legibilidad
- Al final de conversaciones productivas, ofrece agendar una llamada

Cuando el usuario esté listo para contratar o quiera más información:
- Sugiere usar el botón "Solicitar Información" 
- Ofrece el WhatsApp para contacto inmediato
- Menciona que pueden ver sus solicitudes en "Mis Solicitudes"
`;