import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Target,
  TrendingUp,
  Award,
  FileText,
  AlertTriangle,
  ChevronRight,
  Zap,
  Search,
  UserCheck,
  FileSearch,
  ShieldCheck,
  Star,
  Phone,
  GraduationCap,
  Code,
  Bug,
  MessageCircle
} from 'lucide-react';

import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';
import { ServiceRequestButton } from '~/components/services/service-request-button';
import { WhatsAppButton } from '~/components/services/whatsapp-button';
import { trackServiceInfoClick } from '~/actions/services/track-info-click';

// Complete service database with URL slugs matching the service cards
const serviceDatabase: Record<string, {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
  process: { step: string; description: string }[];
  deliverables: string[];
  duration: string;
  targetAudience: string[];
  prerequisites?: string[];
  methodology?: string;
  tools?: string[];
  price?: string;
  successStories?: string;
  faqs?: { question: string; answer: string }[];
  relatedServices?: string[];
}> = {
  // Análisis de Madurez en Ciberseguridad
  'anlisis-de-madurez-en-ciberseguridad': {
    id: 'anlisis-de-madurez-en-ciberseguridad',
    title: 'Análisis de Madurez en Ciberseguridad',
    category: 'assessment',
    icon: ShieldCheck,
    shortDescription: 'Evaluación completa del nivel de madurez en ciberseguridad de tu organización',
    fullDescription: 'Evaluación exhaustiva del nivel de madurez en ciberseguridad de tu organización siguiendo frameworks reconocidos como NIST CSF, ISO 27001 y CIS Controls. Identificamos gaps, priorizamos mejoras y creamos un roadmap personalizado para elevar tu postura de seguridad.',
    benefits: [
      'Visión 360° de tu madurez actual en ciberseguridad',
      'Benchmarking contra estándares de tu industria',
      'Identificación de quick wins y mejoras de alto impacto',
      'Roadmap priorizado con timeline y presupuesto',
      'Alineación con frameworks internacionales (NIST, ISO, CIS)',
      'Base sólida para certificaciones futuras'
    ],
    process: [
      { step: 'Discovery', description: 'Entendimiento del contexto y objetivos del negocio (2-3 días)' },
      { step: 'Assessment', description: 'Evaluación de controles técnicos y organizacionales (1-2 semanas)' },
      { step: 'Gap Analysis', description: 'Identificación de brechas y áreas de mejora (3-5 días)' },
      { step: 'Benchmarking', description: 'Comparación con mejores prácticas del sector (2-3 días)' },
      { step: 'Roadmap', description: 'Desarrollo de plan de mejora priorizado (3-5 días)' },
      { step: 'Presentación', description: 'Workshop ejecutivo con resultados y next steps (1 día)' }
    ],
    deliverables: [
      'Informe de madurez actual con scoring detallado',
      'Heat map de riesgos por dominio',
      'Análisis de gaps vs framework elegido',
      'Benchmarking sectorial',
      'Roadmap de 12-24 meses con quick wins',
      'Business case para inversiones en seguridad',
      'Dashboard ejecutivo interactivo'
    ],
    duration: '3-4 semanas',
    targetAudience: [
      'Organizaciones iniciando su journey en ciberseguridad',
      'Empresas preparándose para certificaciones',
      'Nuevos CISOs evaluando el estado actual',
      'Post-fusiones y adquisiciones'
    ],
    prerequisites: [
      'Acceso a documentación de políticas existentes',
      'Disponibilidad de stakeholders clave',
      'Compromiso de la dirección'
    ],
    methodology: 'NIST Cybersecurity Framework, ISO 27001, CIS Controls v8, COBIT 2019',
    tools: ['Plataformas de GRC', 'Herramientas de assessment automatizado', 'Dashboards personalizados'],
    price: 'Desde €8,000 - €20,000 según tamaño y complejidad',
    successStories: 'Incremento promedio del 40% en score de madurez en 12 meses',
    faqs: [
      {
        question: '¿Cuánto tiempo toma ver mejoras?',
        answer: 'Los quick wins se implementan en 1-3 meses. El roadmap completo típicamente toma 12-24 meses.'
      },
      {
        question: '¿Necesito un equipo de seguridad interno?',
        answer: 'No es prerequisito. El assessment incluye recomendaciones sobre estructura organizacional óptima.'
      }
    ],
    relatedServices: ['consultoria-iso-27001', 'ciso-as-a-service', 'formacion-ciberseguridad']
  },

  // Pentest
  'pentest': {
    id: 'pentest',
    title: 'Pentest',
    category: 'testing',
    icon: Search,
    shortDescription: 'Pruebas de penetración profesionales para identificar vulnerabilidades',
    fullDescription: 'Pruebas de penetración profesionales realizadas por ethical hackers certificados para identificar y validar vulnerabilidades en tus sistemas antes que los atacantes. Simulamos ataques reales usando las mismas técnicas y herramientas que utilizan los cibercriminales.',
    benefits: [
      'Identificación de vulnerabilidades reales explotables',
      'Validación del impacto real en el negocio',
      'Cumplimiento con requisitos regulatorios (PCI-DSS, ISO 27001)',
      'Mejora de la postura de seguridad general',
      'Entrenamiento práctico para tu equipo de respuesta',
      'Justificación para inversiones en seguridad'
    ],
    process: [
      { step: 'Scoping', description: 'Definición de alcance, reglas de engagement y objetivos (1-2 días)' },
      { step: 'Reconocimiento', description: 'Recopilación de información y footprinting (2-3 días)' },
      { step: 'Escaneo', description: 'Identificación de servicios y vulnerabilidades (3-5 días)' },
      { step: 'Explotación', description: 'Intento de compromiso controlado de sistemas (5-10 días)' },
      { step: 'Post-Explotación', description: 'Evaluación de impacto y persistencia (2-3 días)' },
      { step: 'Reporting', description: 'Documentación detallada y recomendaciones (3-5 días)' }
    ],
    deliverables: [
      'Informe ejecutivo con resumen de riesgos',
      'Informe técnico detallado con PoCs',
      'Matriz de vulnerabilidades CVSS v3.1',
      'Videos de demostración de exploits',
      'Checklist de remediación priorizada',
      'Certificado de pentest para compliance'
    ],
    duration: '2-4 semanas según alcance',
    targetAudience: [
      'Empresas con aplicaciones web críticas',
      'Organizaciones con requisitos de compliance',
      'Pre-lanzamiento de nuevos servicios',
      'Validación post-implementación de seguridad'
    ],
    prerequisites: [
      'Autorización legal firmada',
      'Definición clara del alcance',
      'Ventana de pruebas acordada',
      'Backups actualizados'
    ],
    methodology: 'OWASP Testing Guide, PTES, NIST SP 800-115',
    tools: ['Burp Suite Pro', 'Metasploit', 'Cobalt Strike', 'Nmap', 'Custom scripts'],
    price: 'Desde €5,000 para aplicaciones web, €15,000+ para infraestructura completa',
    successStories: 'Detección de vulnerabilidades críticas en 85% de los tests realizados',
    faqs: [
      {
        question: '¿Puede causar downtime?',
        answer: 'Nuestras pruebas son controladas y coordinadas para minimizar cualquier impacto. En 10 años, 0 incidentes de disponibilidad.'
      },
      {
        question: '¿Qué tipos de pentest ofrecen?',
        answer: 'Black box, grey box, white box, red team, aplicaciones web, APIs, móvil, infraestructura, wireless, y social engineering.'
      }
    ],
    relatedServices: ['analisis-vulnerabilidades', 'auditoria-seguridad', 'desarrollo-seguro']
  },

  // Departamento Externalizado
  'departamento-externalizado-de-ciberseguridad': {
    id: 'departamento-externalizado-de-ciberseguridad',
    title: 'Departamento Externalizado de Ciberseguridad',
    category: 'managed',
    icon: Users,
    shortDescription: 'Equipo completo de seguridad que actúa como tu departamento interno',
    fullDescription: 'Equipo completo de ciberseguridad gestionado que actúa como una extensión natural de tu organización. Proporcionamos todas las funciones de un departamento de seguridad maduro sin los costos y complejidad de construirlo internamente.',
    benefits: [
      'Equipo completo de expertos desde el día 1',
      'Ahorro del 50-70% vs equipo interno equivalente',
      'Cobertura 24/7/365 sin gestión de turnos',
      'Acceso a especialistas senior cuando se necesitan',
      'Escalabilidad según crecimiento',
      'Sin problemas de retención de talento'
    ],
    process: [
      { step: 'Transición', description: 'Onboarding y transferencia de conocimiento (2-4 semanas)' },
      { step: 'Estabilización', description: 'Establecimiento de procesos y baseline (1-2 meses)' },
      { step: 'Optimización', description: 'Mejora continua de controles (3-6 meses)' },
      { step: 'Maduración', description: 'Evolución hacia capacidades avanzadas (6-12 meses)' },
      { step: 'Innovación', description: 'Adopción de nuevas tecnologías y prácticas (continuo)' }
    ],
    deliverables: [
      'Equipo dedicado con SLAs garantizados',
      'SOC 24/7 con monitoreo continuo',
      'Gestión de vulnerabilidades',
      'Respuesta a incidentes',
      'Cumplimiento y auditorías',
      'Arquitectura de seguridad',
      'Awareness y formación',
      'Reportes ejecutivos mensuales'
    ],
    duration: 'Servicio continuo, contratos anuales',
    targetAudience: [
      'Empresas sin departamento de seguridad',
      'Organizaciones en crecimiento rápido',
      'Empresas con presupuesto limitado para seguridad',
      'Post-incidente necesitando mejora rápida'
    ],
    prerequisites: [
      'Compromiso de integración con el equipo',
      'Accesos necesarios a sistemas',
      'Punto de contacto ejecutivo'
    ],
    methodology: 'ITIL, ISO 27001, NIST CSF',
    price: 'Desde €5,000/mes para empresas pequeñas, €15,000-50,000/mes para medianas/grandes',
    successStories: 'Reducción del 80% en incidentes de seguridad en el primer año',
    relatedServices: ['soc-as-service', 'ciso-as-a-service', 'respuesta-incidentes']
  },

  // CISO-as-a-Service
  'ciso-as-a-service': {
    id: 'ciso-as-a-service',
    title: 'CISO-as-a-Service',
    category: 'managed',
    icon: UserCheck,
    shortDescription: 'Accede a un CISO experimentado sin el coste de un ejecutivo a tiempo completo',
    fullDescription: 'Servicio de Chief Information Security Officer virtual que proporciona liderazgo estratégico en ciberseguridad, gobierno, riesgo y cumplimiento. Ideal para organizaciones que necesitan expertise ejecutivo sin el costo de un CISO a tiempo completo.',
    benefits: [
      'Liderazgo ejecutivo experimentado inmediato',
      'Costo 70% menor que CISO a tiempo completo',
      'Experiencia multi-industria y mejores prácticas',
      'Flexibilidad para escalar según necesidades',
      'Red de contactos y vendors establecida',
      'Continuidad sin problemas de sucesión'
    ],
    process: [
      { step: 'Assessment', description: 'Evaluación inicial de estado y necesidades (1-2 semanas)' },
      { step: 'Estrategia', description: 'Desarrollo de estrategia de seguridad a 3 años (2-3 semanas)' },
      { step: 'Gobierno', description: 'Establecimiento de estructura de gobierno (1-2 meses)' },
      { step: 'Ejecución', description: 'Implementación del programa de seguridad (continuo)' },
      { step: 'Evolución', description: 'Mejora continua y adaptación (permanente)' }
    ],
    deliverables: [
      'Estrategia de ciberseguridad alineada al negocio',
      'Programa de gestión de riesgos',
      'Reporting a board y comité de dirección',
      'Políticas y procedimientos de seguridad',
      'Gestión de presupuesto de seguridad',
      'Liderazgo en incidentes mayores',
      'Relación con reguladores y auditores'
    ],
    duration: 'Engagement flexible: 2-5 días/mes típicamente',
    targetAudience: [
      'Empresas medianas sin CISO',
      'Startups en crecimiento',
      'Organizaciones en transformación digital',
      'Interim durante búsqueda de CISO permanente'
    ],
    methodology: 'NIST CSF, ISO 27001, COBIT',
    price: 'Desde €3,000/mes (2 días) hasta €10,000/mes (5 días)',
    successStories: 'ROI promedio de 300% en reducción de riesgos en 18 meses',
    relatedServices: ['departamento-externalizado-de-ciberseguridad', 'consultoria-iso-27001']
  },

  // Análisis Forense
  'anlisis-forense': {
    id: 'anlisis-forense',
    title: 'Análisis Forense',
    category: 'incident',
    icon: FileSearch,
    shortDescription: 'Investigación forense digital para determinar alcance y origen de incidentes',
    fullDescription: 'Investigación forense digital profesional para determinar el alcance, origen e impacto de incidentes de seguridad. Utilizamos técnicas avanzadas para preservar evidencia, reconstruir eventos y proporcionar información accionable para prevención futura.',
    benefits: [
      'Determinación exacta del alcance del incidente',
      'Preservación de evidencia para acciones legales',
      'Identificación de vectores de ataque y TTPs',
      'Timeline detallado de eventos',
      'Recuperación de datos eliminados',
      'Base para mejoras de seguridad'
    ],
    process: [
      { step: 'Preservación', description: 'Captura y preservación de evidencia (inmediato)' },
      { step: 'Adquisición', description: 'Copia forense de sistemas afectados (1-2 días)' },
      { step: 'Análisis', description: 'Examinación detallada de evidencia (3-10 días)' },
      { step: 'Correlación', description: 'Reconstrucción de timeline y eventos (2-5 días)' },
      { step: 'Reporte', description: 'Documentación de hallazgos y conclusiones (2-3 días)' }
    ],
    deliverables: [
      'Informe forense detallado',
      'Timeline de eventos del incidente',
      'Análisis de malware si aplica',
      'Evidencia preservada chain-of-custody',
      'Recomendaciones de mejora',
      'Testimonio experto si se requiere'
    ],
    duration: '1-3 semanas según complejidad',
    targetAudience: [
      'Víctimas de data breach',
      'Casos de fraude interno',
      'Disputas legales',
      'Investigaciones de compliance'
    ],
    methodology: 'NIST SP 800-86, ISO 27037, SANS Digital Forensics',
    price: 'Desde €5,000 para casos simples, €20,000+ para investigaciones complejas',
    successStories: 'Evidencia admitida en 100% de casos judiciales',
    relatedServices: ['respuesta-incidentes', 'soc-as-service']
  },

  // Respuesta Rápida ante Incidentes
  'respuesta-rpida-ante-incidentes': {
    id: 'respuesta-rpida-ante-incidentes',
    title: 'Respuesta Rápida ante Incidentes',
    category: 'incident',
    icon: AlertTriangle,
    shortDescription: 'Respuesta inmediata de emergencia ante incidentes de seguridad activos',
    fullDescription: 'Servicio de respuesta inmediata 24/7 para contener, erradicar y recuperarse de incidentes de seguridad activos. Nuestro equipo CERT actúa en menos de 2 horas para minimizar el impacto y restaurar las operaciones.',
    benefits: [
      'Activación inmediata en <2 horas',
      'Contención rápida para limitar daños',
      'Reducción del downtime hasta 75%',
      'Preservación de evidencia crítica',
      'Comunicación gestionada con stakeholders',
      'Prevención de incidentes similares'
    ],
    process: [
      { step: 'Activación', description: 'Respuesta inmediata y triage (<2 horas)' },
      { step: 'Contención', description: 'Aislamiento y limitación del impacto (2-6 horas)' },
      { step: 'Investigación', description: 'Análisis de causa raíz y alcance (1-3 días)' },
      { step: 'Erradicación', description: 'Eliminación completa de la amenaza (1-2 días)' },
      { step: 'Recuperación', description: 'Restauración segura de servicios (2-5 días)' },
      { step: 'Post-Incidente', description: 'Lecciones aprendidas y mejoras (1 semana)' }
    ],
    deliverables: [
      'Contención inmediata del incidente',
      'Informe ejecutivo del incidente',
      'Análisis técnico detallado',
      'Plan de remediación',
      'Comunicados para stakeholders',
      'Sesión de lecciones aprendidas'
    ],
    duration: 'Respuesta inmediata, resolución en 1-2 semanas',
    targetAudience: [
      'Víctimas de ransomware',
      'Brechas de seguridad activas',
      'Ataques DDoS',
      'Compromisos de email empresarial'
    ],
    methodology: 'NIST Incident Response, SANS IR Process',
    price: 'Retainer desde €2,000/mes, €500-1,000/hora durante incidente',
    successStories: 'Tiempo medio de contención: 4 horas. 0 re-infecciones',
    relatedServices: ['soc-as-service', 'anlisis-forense', 'departamento-externalizado-de-ciberseguridad']
  },

  // Formación en Ciberseguridad
  'formacin-en-ciberseguridad': {
    id: 'formacin-en-ciberseguridad',
    title: 'Formación en Ciberseguridad',
    category: 'training',
    icon: GraduationCap,
    shortDescription: 'Programas de formación especializados para elevar las competencias en seguridad',
    fullDescription: 'Programas de formación especializados en ciberseguridad para todos los niveles de tu organización. Desde awareness básico hasta certificaciones técnicas avanzadas, preparamos a tu equipo para enfrentar los desafíos de seguridad actuales.',
    benefits: [
      'Reducción del 70% en incidentes por factor humano',
      'Cumplimiento con requisitos de formación regulatoria',
      'Desarrollo de cultura de seguridad',
      'Retención de talento mediante desarrollo profesional',
      'Certificaciones reconocidas internacionalmente',
      'Mejora en detección y respuesta a amenazas'
    ],
    process: [
      { step: 'Assessment', description: 'Evaluación de necesidades y nivel actual (1-2 días)' },
      { step: 'Diseño', description: 'Desarrollo de programa personalizado (3-5 días)' },
      { step: 'Preparación', description: 'Creación de materiales y laboratorios (1-2 semanas)' },
      { step: 'Impartición', description: 'Sesiones presenciales o virtuales (variable)' },
      { step: 'Evaluación', description: 'Medición de efectividad y mejora continua (continuo)' }
    ],
    deliverables: [
      'Programa de formación personalizado',
      'Materiales y recursos de aprendizaje',
      'Laboratorios prácticos',
      'Certificados de completación',
      'Métricas de mejora',
      'Soporte post-formación'
    ],
    duration: 'Desde workshops de 1 día hasta programas de 6 meses',
    targetAudience: [
      'Todos los empleados (awareness)',
      'Equipos IT y desarrollo',
      'Ejecutivos y management',
      'Equipos de seguridad'
    ],
    methodology: 'SANS, (ISC)², CompTIA, metodología propia',
    price: 'Desde €500/persona para awareness, €3,000-5,000 para certificaciones',
    successStories: '95% de tasa de aprobación en certificaciones',
    relatedServices: ['consultoria-iso-27001', 'departamento-externalizado-de-ciberseguridad']
  },

  // SOC-as-a-Service
  'soc-as-a-service': {
    id: 'soc-as-a-service',
    title: 'SOC-as-a-Service',
    category: 'managed',
    icon: Shield,
    shortDescription: 'Centro de operaciones de seguridad 24/7 gestionado',
    fullDescription: 'Centro de Operaciones de Seguridad completamente gestionado que proporciona monitoreo continuo, detección de amenazas y respuesta a incidentes 24/7. Combinamos tecnología SIEM/SOAR de última generación con analistas expertos.',
    benefits: [
      'Monitoreo 24/7/365 sin interrupciones',
      'Detección temprana de amenazas avanzadas',
      'Reducción del MTTD y MTTR en 80%',
      'Costo 60% menor que SOC interno',
      'Cumplimiento con requisitos regulatorios',
      'Escalabilidad instantánea'
    ],
    process: [
      { step: 'Onboarding', description: 'Integración de fuentes de logs y sensores (2-4 semanas)' },
      { step: 'Tuning', description: 'Ajuste de reglas y reducción de falsos positivos (1-2 meses)' },
      { step: 'Operación', description: 'Monitoreo y respuesta continua 24/7 (permanente)' },
      { step: 'Optimización', description: 'Mejora continua de detecciones (mensual)' },
      { step: 'Evolución', description: 'Adopción de nuevas capacidades (trimestral)' }
    ],
    deliverables: [
      'Monitoreo 24/7 con SLAs garantizados',
      'Portal de cliente con dashboards en tiempo real',
      'Alertas priorizadas y contextualizadas',
      'Respuesta a incidentes Tier 1-3',
      'Reportes ejecutivos mensuales',
      'Threat intelligence personalizada',
      'Playbooks automatizados'
    ],
    duration: 'Servicio continuo con contratos anuales',
    targetAudience: [
      'Empresas sin SOC propio',
      'Organizaciones con requisitos 24/7',
      'Sectores regulados (finanzas, salud)',
      'Empresas en transformación digital'
    ],
    methodology: 'MITRE ATT&CK, Cyber Kill Chain, NIST',
    tools: ['Splunk/QRadar/Sentinel', 'SOAR platforms', 'EDR/XDR', 'Threat Intelligence feeds'],
    price: 'Desde €3,000/mes para PyMEs, €10,000-30,000/mes para empresas',
    successStories: 'Detección de amenazas en <5 minutos, respuesta en <30 minutos',
    relatedServices: ['respuesta-rpida-ante-incidentes', 'departamento-externalizado-de-ciberseguridad']
  },

  // Desarrollo Seguro
  'desarrollo-seguro': {
    id: 'desarrollo-seguro',
    title: 'Desarrollo Seguro',
    category: 'development',
    icon: Code,
    shortDescription: 'Integración de seguridad en el ciclo de desarrollo de software',
    fullDescription: 'Implementación de prácticas DevSecOps y secure coding para integrar la seguridad desde el diseño hasta el despliegue. Reducimos vulnerabilidades en un 90% mediante shift-left security y automatización.',
    benefits: [
      'Reducción del 90% en vulnerabilidades en producción',
      'Menor costo de remediación (100x más barato)',
      'Aceleración del time-to-market',
      'Cumplimiento con estándares (OWASP, PCI-DSS)',
      'Cultura de seguridad en desarrollo',
      'Automatización de controles de seguridad'
    ],
    process: [
      { step: 'Assessment', description: 'Evaluación de prácticas actuales y gaps (1 semana)' },
      { step: 'Diseño', description: 'Arquitectura de pipeline DevSecOps (2 semanas)' },
      { step: 'Implementación', description: 'Integración de herramientas y controles (4-8 semanas)' },
      { step: 'Training', description: 'Formación en secure coding (2-4 semanas)' },
      { step: 'Optimización', description: 'Mejora continua del proceso (permanente)' }
    ],
    deliverables: [
      'Pipeline CI/CD con seguridad integrada',
      'Políticas de secure coding',
      'Herramientas SAST/DAST/SCA configuradas',
      'Training para desarrolladores',
      'Dashboards de seguridad en desarrollo',
      'Biblioteca de código seguro'
    ],
    duration: '3-6 meses para implementación completa',
    targetAudience: [
      'Equipos de desarrollo ágil',
      'Organizaciones DevOps',
      'Empresas de software',
      'Fintechs y healthtech'
    ],
    methodology: 'OWASP SAMM, BSIMM, NIST SSDF',
    tools: ['SonarQube', 'Checkmarx', 'Snyk', 'GitLab Security', 'Veracode'],
    price: 'Desde €15,000 implementación + €2,000/mes soporte',
    successStories: 'ROI de 300% en el primer año por reducción de incidentes',
    relatedServices: ['pentest', 'formacin-en-ciberseguridad']
  },

  // Análisis de Vulnerabilidades
  'anlisis-de-vulnerabilidades': {
    id: 'anlisis-de-vulnerabilidades',
    title: 'Análisis de Vulnerabilidades',
    category: 'assessment',
    icon: Bug,
    shortDescription: 'Identificación y priorización de vulnerabilidades en tu infraestructura',
    fullDescription: 'Evaluación exhaustiva de vulnerabilidades en infraestructura, aplicaciones y configuraciones. Utilizamos herramientas automatizadas y análisis manual para identificar, validar y priorizar vulnerabilidades según el riesgo real para tu negocio.',
    benefits: [
      'Visibilidad completa de tu superficie de ataque',
      'Priorización basada en riesgo de negocio',
      'Reducción del 85% en vulnerabilidades críticas',
      'Cumplimiento con requisitos de compliance',
      'Métricas de mejora de seguridad',
      'Prevención proactiva de brechas'
    ],
    process: [
      { step: 'Discovery', description: 'Mapeo de activos y superficie de ataque (2-3 días)' },
      { step: 'Scanning', description: 'Escaneo automatizado de vulnerabilidades (3-5 días)' },
      { step: 'Validación', description: 'Verificación manual y eliminación de falsos positivos (2-3 días)' },
      { step: 'Análisis', description: 'Evaluación de impacto y explotabilidad (2-3 días)' },
      { step: 'Reporting', description: 'Informe detallado con plan de remediación (2 días)' }
    ],
    deliverables: [
      'Inventario completo de activos',
      'Informe de vulnerabilidades CVSS',
      'Dashboard ejecutivo de riesgos',
      'Plan de remediación priorizado',
      'Guías técnicas de mitigación',
      'Comparativa con escaneos anteriores'
    ],
    duration: '2-3 semanas',
    targetAudience: [
      'Empresas con infraestructura crítica',
      'Requisitos de compliance periódicos',
      'Pre y post implementaciones',
      'Validación de patches'
    ],
    methodology: 'OWASP, CVE, CVSS v3.1',
    tools: ['Nessus', 'Qualys', 'OpenVAS', 'Burp Suite', 'Metasploit'],
    price: 'Desde €2,000 para redes pequeñas, €5,000-15,000 para empresas',
    successStories: 'Identificación promedio de 200+ vulnerabilidades, 15-20 críticas',
    relatedServices: ['pentest', 'departamento-externalizado-de-ciberseguridad']
  },

  // Compliance y Normativas
  'compliance-y-normativas': {
    id: 'compliance-y-normativas',
    title: 'Compliance y Normativas',
    category: 'compliance',
    icon: FileText,
    shortDescription: 'Cumplimiento integral de regulaciones de seguridad y privacidad',
    fullDescription: 'Servicios especializados para alcanzar y mantener el cumplimiento con regulaciones de seguridad y privacidad como GDPR, NIS2, DORA, PCI-DSS, HIPAA. Simplificamos el compliance mediante frameworks integrados y automatización.',
    benefits: [
      'Evitar multas y sanciones regulatorias',
      'Ventaja competitiva en licitaciones',
      'Confianza de clientes y partners',
      'Framework unificado para múltiples regulaciones',
      'Reducción del 50% en esfuerzo de auditoría',
      'Mejora general de la seguridad'
    ],
    process: [
      { step: 'Gap Analysis', description: 'Evaluación de cumplimiento actual (1-2 semanas)' },
      { step: 'Roadmap', description: 'Plan de cumplimiento priorizado (1 semana)' },
      { step: 'Implementación', description: 'Desarrollo de controles y documentación (2-6 meses)' },
      { step: 'Validación', description: 'Auditoría interna y ajustes (2-4 semanas)' },
      { step: 'Certificación', description: 'Soporte en auditoría externa (2-4 semanas)' },
      { step: 'Mantenimiento', description: 'Cumplimiento continuo (permanente)' }
    ],
    deliverables: [
      'Análisis de gaps detallado',
      'Políticas y procedimientos requeridos',
      'Registros de tratamiento (GDPR)',
      'Evaluaciones de impacto',
      'Evidencias para auditoría',
      'Dashboard de compliance',
      'Formación específica'
    ],
    duration: '3-9 meses según regulación y madurez',
    targetAudience: [
      'Empresas procesando datos personales (GDPR)',
      'Entidades financieras (DORA, PCI-DSS)',
      'Operadores críticos (NIS2)',
      'Sector salud (HIPAA, RGPD)'
    ],
    methodology: 'ISO 27001/27701, NIST, COSO',
    price: 'Desde €10,000 para GDPR básico, €30,000-100,000 para programas completos',
    successStories: '100% de éxito en certificaciones, 0 multas en clientes',
    relatedServices: ['consultoria-iso-27001', 'ciso-as-a-service']
  },

  // Keep the original services for backwards compatibility
  'auditoria-seguridad': {
    id: 'auditoria-seguridad',
    title: 'Auditoría de Seguridad',
    category: 'assessment',
    icon: Search,
    shortDescription: 'Evaluación completa de tu infraestructura de seguridad',
    fullDescription: 'Evaluación exhaustiva de la infraestructura tecnológica de tu organización para identificar vulnerabilidades, riesgos y áreas de mejora en ciberseguridad. Utilizamos metodologías reconocidas internacionalmente como OWASP, NIST y ISO 27001.',
    benefits: [
      'Identificación proactiva de vulnerabilidades antes de que sean explotadas',
      'Mapa completo de riesgos con priorización basada en impacto',
      'Cumplimiento con regulaciones y estándares de la industria',
      'Reducción de hasta 70% en incidentes de seguridad',
      'Informe ejecutivo para la alta dirección',
      'Plan de remediación detallado con cronograma'
    ],
    process: [
      { step: 'Planificación', description: 'Reunión inicial para definir alcance, objetivos y cronograma (1-2 días)' },
      { step: 'Recopilación', description: 'Análisis de documentación y arquitectura existente (2-3 días)' },
      { step: 'Evaluación', description: 'Escaneo automatizado y revisión manual de sistemas (5-7 días)' },
      { step: 'Análisis', description: 'Clasificación de vulnerabilidades y evaluación de riesgos (2-3 días)' },
      { step: 'Informe', description: 'Elaboración de informe detallado con recomendaciones (2-3 días)' },
      { step: 'Presentación', description: 'Sesión ejecutiva de presentación de resultados (1 día)' }
    ],
    deliverables: [
      'Informe ejecutivo de 10-15 páginas',
      'Informe técnico detallado (50+ páginas)',
      'Matriz de riesgos priorizada',
      'Plan de remediación con quick wins',
      'Dashboard interactivo de vulnerabilidades',
      'Sesión de transferencia de conocimiento'
    ],
    duration: '2-3 semanas',
    targetAudience: [
      'Empresas medianas y grandes',
      'Organizaciones con datos sensibles',
      'Empresas en proceso de certificación',
      'Organizaciones post-incidente'
    ],
    prerequisites: [
      'Acceso a la documentación de sistemas',
      'Punto de contacto técnico designado',
      'Ventana de mantenimiento para pruebas'
    ],
    methodology: 'OWASP Testing Guide v4.2, NIST Cybersecurity Framework, ISO 27001:2022',
    tools: ['Nessus Professional', 'Burp Suite Pro', 'Metasploit Framework', 'Nmap', 'Wireshark'],
    price: 'Desde €5,000 - €25,000 según el alcance',
    successStories: 'Más de 150 auditorías realizadas con 0 brechas posteriores en clientes auditados',
    faqs: [
      {
        question: '¿La auditoría afecta la operación normal?',
        answer: 'No, realizamos las pruebas en horarios acordados y con técnicas no intrusivas para minimizar cualquier impacto.'
      },
      {
        question: '¿Qué incluye el informe ejecutivo?',
        answer: 'Resumen de hallazgos críticos, impacto en el negocio, recomendaciones prioritarias y roadmap de mejora.'
      },
      {
        question: '¿Ofrecen soporte post-auditoría?',
        answer: 'Sí, incluimos 3 meses de soporte para aclaración de dudas y validación de remediaciones.'
      }
    ],
    relatedServices: ['test-penetracion', 'analisis-vulnerabilidades', 'consultoria-iso-27001']
  },
  'test-penetracion': {
    id: 'test-penetracion',
    title: 'Test de Penetración',
    category: 'testing',
    icon: Shield,
    shortDescription: 'Simulación de ataques reales para validar tu seguridad',
    fullDescription: 'Simulación controlada de ataques reales para evaluar la resistencia de tus sistemas ante amenazas actuales. Nuestros ethical hackers certificados utilizan las mismas técnicas que los ciberdelincuentes para encontrar y validar vulnerabilidades explotables.',
    benefits: [
      'Validación real de vulnerabilidades explotables',
      'Comprensión del impacto real de una brecha',
      'Entrenamiento práctico para tu equipo de TI',
      'Evidencia para justificar inversiones en seguridad',
      'Mejora continua del programa de seguridad',
      'Certificado de prueba para compliance'
    ],
    process: [
      { step: 'Reconocimiento', description: 'Recopilación de información pública y análisis OSINT (2-3 días)' },
      { step: 'Escaneo', description: 'Identificación de servicios y versiones expuestas (2-3 días)' },
      { step: 'Enumeración', description: 'Mapeo detallado de vectores de ataque (3-4 días)' },
      { step: 'Explotación', description: 'Intento controlado de comprometer sistemas (5-7 días)' },
      { step: 'Post-explotación', description: 'Evaluación del impacto y movimiento lateral (2-3 días)' },
      { step: 'Reporte', description: 'Documentación detallada con proof of concepts (3-4 días)' }
    ],
    deliverables: [
      'Informe ejecutivo con métricas de riesgo',
      'Informe técnico con proof of concepts',
      'Videos de demostración de explotación',
      'Matriz de ataque MITRE ATT&CK',
      'Recomendaciones priorizadas',
      'Retest gratuito tras remediación'
    ],
    duration: '3-4 semanas',
    targetAudience: [
      'Empresas con infraestructura crítica',
      'Sector financiero y salud',
      'E-commerce y plataformas digitales',
      'Empresas con requisitos PCI-DSS'
    ],
    methodology: 'PTES, OWASP, MITRE ATT&CK Framework',
    price: 'Desde €8,000 - €40,000 según complejidad',
    relatedServices: ['auditoria-seguridad', 'soc-as-service', 'respuesta-incidentes']
  },
  'soc-as-service': {
    id: 'soc-as-service',
    title: 'SOC as a Service',
    category: 'managed',
    icon: Users,
    shortDescription: 'Centro de operaciones de seguridad 24/7',
    fullDescription: 'Centro de Operaciones de Seguridad completamente gestionado que monitorea, detecta y responde a amenazas 24/7/365. Combinamos tecnología avanzada de SIEM/SOAR con analistas certificados para proteger tu organización continuamente.',
    benefits: [
      'Monitoreo continuo 24/7/365 sin interrupciones',
      'Reducción del tiempo de detección de 200 días a <24 horas',
      'Ahorro de 60-70% vs SOC interno',
      'Acceso a expertos certificados (GCIH, GCIA, GNFA)',
      'Cumplimiento automático de regulaciones',
      'Escalabilidad inmediata según necesidades'
    ],
    process: [
      { step: 'Onboarding', description: 'Integración de logs y configuración inicial (1-2 semanas)' },
      { step: 'Baseline', description: 'Establecimiento de comportamiento normal (2-4 semanas)' },
      { step: 'Tuning', description: 'Ajuste de reglas y reducción de falsos positivos (continuo)' },
      { step: 'Monitoreo', description: 'Vigilancia 24/7 con análisis en tiempo real (permanente)' },
      { step: 'Respuesta', description: 'Contención y mitigación de incidentes (<1 hora)' },
      { step: 'Mejora', description: 'Optimización continua y threat hunting (mensual)' }
    ],
    deliverables: [
      'Portal de cliente con dashboard en tiempo real',
      'Alertas priorizadas con contexto',
      'Informes mensuales de tendencias',
      'Análisis forense cuando sea necesario',
      'Playbooks personalizados de respuesta',
      'Threat intelligence personalizado'
    ],
    duration: 'Servicio continuo (contrato mínimo 12 meses)',
    targetAudience: [
      'Empresas sin SOC propio',
      'Organizaciones con requisitos 24/7',
      'Empresas en expansión',
      'Sector crítico y regulado'
    ],
    methodology: 'NIST Incident Response, MITRE ATT&CK, Kill Chain',
    price: 'Desde €2,000/mes para empresas pequeñas',
    relatedServices: ['respuesta-incidentes', 'analisis-vulnerabilidades']
  },
  'respuesta-incidentes': {
    id: 'respuesta-incidentes',
    title: 'Respuesta a Incidentes',
    category: 'incident',
    icon: AlertTriangle,
    shortDescription: 'Respuesta rápida ante brechas y ataques',
    fullDescription: 'Servicio especializado de respuesta rápida ante brechas de seguridad, ransomware y otros incidentes críticos. Nuestro equipo CSIRT certificado actúa inmediatamente para contener, erradicar y recuperar tus operaciones minimizando el impacto.',
    benefits: [
      'Respuesta inmediata en <2 horas',
      'Reducción del tiempo de inactividad en 75%',
      'Preservación de evidencia para acciones legales',
      'Minimización de pérdidas financieras',
      'Comunicación gestionada con stakeholders',
      'Prevención de reinfección'
    ],
    process: [
      { step: 'Activación', description: 'Respuesta inmediata y evaluación inicial (<2 horas)' },
      { step: 'Contención', description: 'Aislamiento de sistemas afectados (2-6 horas)' },
      { step: 'Investigación', description: 'Análisis forense y determinación del alcance (1-3 días)' },
      { step: 'Erradicación', description: 'Eliminación completa de la amenaza (1-2 días)' },
      { step: 'Recuperación', description: 'Restauración segura de operaciones (2-5 días)' },
      { step: 'Lecciones', description: 'Análisis post-incidente y mejoras (1 semana después)' }
    ],
    deliverables: [
      'Informe ejecutivo del incidente',
      'Timeline detallado de eventos',
      'Análisis de causa raíz',
      'Evidencia forense preservada',
      'Plan de mejora de seguridad',
      'Entrenamiento post-incidente'
    ],
    duration: '1-2 semanas para resolución completa',
    targetAudience: [
      'Víctimas de ransomware',
      'Empresas con brecha activa',
      'Organizaciones sin equipo IR',
      'Casos de insider threat'
    ],
    methodology: 'SANS Incident Response, NIST SP 800-61r2',
    price: 'Retainer: €1,500/mes + €500/hora en incidente',
    relatedServices: ['soc-as-service', 'analisis-vulnerabilidades']
  },
  // Add more services as needed...
};
interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
    serviceId: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { serviceId } = await params;
  const service = serviceDatabase[serviceId];
  
  if (!service) {
    return {
      title: 'Servicio no encontrado | Minery',
      description: 'El servicio solicitado no existe'
    };
  }

  return {
    title: `${service.title} | Servicios de Ciberseguridad | Minery`,
    description: service.fullDescription.substring(0, 160),
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const session = await auth();
  const { slug, serviceId, locale } = await params;
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  const ctx = await getAuthOrganizationContext();
  const service = serviceDatabase[serviceId];

  if (!service) {
    notFound();
  }
  
  // Track the page view
  await trackServiceInfoClick(
    service.title,
    service.category,
    ctx.organization.id
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      assessment: 'Evaluación',
      testing: 'Testing',
      managed: 'Gestionado',
      incident: 'Incidentes'
    };
    return labels[category] || category;
  };

  const getRelatedServices = () => {
    return service.relatedServices?.map(id => serviceDatabase[id]).filter(Boolean) || [];
  };

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <service.icon className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              index={{
                route: routes.dashboard.organizations.slug.Home,
                title: "Servicios"
              }}
              title={service.title}
            />
          </div>
          <PageActions>
            <Link href={`/${locale}/organizations/${slug}/services`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Servicios
              </Button>
            </Link>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>

      <PageBody>
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="text-sm">
                {getCategoryLabel(service.category)}
              </Badge>
              {service.price && (
                <Badge variant="secondary" className="text-sm">
                  {service.price}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{service.title}</h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              {service.fullDescription}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Beneficios Clave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {service.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Proceso de Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {service.process.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{step.step}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deliverables */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Entregables
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {service.deliverables.map((deliverable, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQs */}
              {service.faqs && service.faqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Preguntas Frecuentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {service.faqs.map((faq, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Rápida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Clock className="h-4 w-4" />
                      Duración
                    </div>
                    <p className="text-sm text-muted-foreground">{service.duration}</p>
                  </div>
                  
                  {service.methodology && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Shield className="h-4 w-4" />
                        Metodología
                      </div>
                      <p className="text-sm text-muted-foreground">{service.methodology}</p>
                    </div>
                  )}

                  {service.targetAudience.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Target className="h-4 w-4" />
                        Ideal Para
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {service.targetAudience.map((audience, index) => (
                          <li key={index}>• {audience}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {service.successStories && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Award className="h-4 w-4" />
                        Casos de Éxito
                      </div>
                      <p className="text-sm text-muted-foreground">{service.successStories}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>¿Listo para empezar?</CardTitle>
                  <CardDescription>
                    Nuestro equipo está listo para ayudarte a proteger tu organización
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ServiceRequestButton 
                    service={{
                      id: service.id,
                      title: service.title
                    }}
                    user={{
                      id: session.user.id || '',
                      name: session.user.name || '',
                      email: session.user.email || ''
                    }}
                    organizationId={ctx.organization.id}
                    organizationSlug={slug}
                  />
                  <WhatsAppButton serviceTitle={service.title} />
                  <div className="text-center">
                    <a href="tel:+34919049788" className="text-sm text-muted-foreground hover:text-primary">
                      <Phone className="inline h-3 w-3 mr-1" />
                      +34 919 049 788
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Certificados ISO 27001</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">+500 clientes satisfechos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">4.9/5 valoración media</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Services */}
              {getRelatedServices().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Servicios Relacionados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getRelatedServices().map((related) => (
                        <Link
                          key={related.id}
                          href={`/${locale}/organizations/${slug}/services/${related.id}`}
                          className="block p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <related.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{related.title}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
