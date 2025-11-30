'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  CheckCircle,
  Clock,
  Users,
  Shield,
  Target,
  TrendingUp,
  Award,
  FileText,
  AlertTriangle,
  Briefcase,
  MessageCircle,
  ChevronRight,
  Zap,
  Search
} from 'lucide-react';

interface ServiceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    category: string;
  };
  onRequestService: () => void;
}

// Detailed service information database
const serviceDetails: Record<string, {
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
}> = {
  'Auditoría de Seguridad': {
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
    tools: [
      'Nessus Professional',
      'Burp Suite Pro',
      'Metasploit Framework',
      'Nmap',
      'Wireshark'
    ],
    price: 'Desde €5,000 - €25,000 según el alcance',
    successStories: 'Más de 150 auditorías realizadas con 0 brechas posteriores en clientes auditados'
  },
  
  'Test de Penetración': {
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
    prerequisites: [
      'Autorización legal firmada',
      'Definición clara del alcance',
      'Contacto de emergencia 24/7',
      'Backups actualizados'
    ],
    methodology: 'PTES, OWASP, MITRE ATT&CK Framework',
    tools: [
      'Cobalt Strike',
      'Empire Framework',
      'BloodHound',
      'Mimikatz',
      'Custom exploits'
    ],
    price: 'Desde €8,000 - €40,000 según complejidad',
    successStories: '500+ pentests realizados, detectando vulnerabilidades críticas en 85% de los casos'
  },

  'SOC as a Service': {
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
    prerequisites: [
      'Logs centralizados disponibles',
      'Ancho de banda suficiente',
      'Proceso de escalación definido'
    ],
    methodology: 'NIST Incident Response, MITRE ATT&CK, Kill Chain',
    tools: [
      'Splunk Enterprise Security',
      'IBM QRadar',
      'CrowdStrike Falcon',
      'Elastic Security',
      'Custom SOAR platform'
    ],
    price: 'Desde €2,000/mes para empresas pequeñas, €5,000-€15,000/mes para medianas',
    successStories: 'Tiempo medio de detección: 15 minutos. 99.9% de disponibilidad garantizada'
  },

  'Respuesta a Incidentes': {
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
    prerequisites: [
      'Autorización para actuar',
      'Acceso administrativo a sistemas',
      'Punto de contacto disponible 24/7'
    ],
    methodology: 'SANS Incident Response, NIST SP 800-61r2',
    tools: [
      'Volatility Framework',
      'FTK Imager',
      'Velociraptor',
      'KAPE',
      'X-Ways Forensics'
    ],
    price: 'Retainer: €1,500/mes + €500/hora en incidente. Sin retainer: €800/hora',
    successStories: '200+ incidentes resueltos, 95% sin reinfección posterior'
  },

  'Consultoría ISO 27001': {
    fullDescription: 'Acompañamiento integral para implementar, mantener y certificar tu Sistema de Gestión de Seguridad de la Información (SGSI) bajo la norma ISO 27001:2022. Incluye gap analysis, implementación y preparación para auditoría.',
    benefits: [
      'Certificación reconocida internacionalmente',
      'Ventaja competitiva en licitaciones',
      'Reducción de primas de seguro cibernético',
      'Framework estructurado de seguridad',
      'Mejora continua documentada',
      'Confianza de clientes y partners'
    ],
    process: [
      { step: 'Gap Analysis', description: 'Evaluación del estado actual vs ISO 27001 (1-2 semanas)' },
      { step: 'Planificación', description: 'Roadmap de implementación y recursos (1 semana)' },
      { step: 'Implementación', description: 'Desarrollo de políticas y controles (3-6 meses)' },
      { step: 'Formación', description: 'Capacitación del personal y awareness (continuo)' },
      { step: 'Auditoría Interna', description: 'Revisión pre-certificación (2 semanas)' },
      { step: 'Certificación', description: 'Apoyo durante auditoría externa (1 semana)' }
    ],
    deliverables: [
      'Informe de gap analysis',
      'Manual del SGSI completo',
      '30+ políticas y procedimientos',
      'Registro de activos',
      'Análisis de riesgos completo',
      'Plan de tratamiento de riesgos',
      'Métricas e indicadores KPI/KRI'
    ],
    duration: '6-9 meses hasta certificación',
    targetAudience: [
      'Empresas en crecimiento',
      'Proveedores de servicios TI',
      'Empresas con datos sensibles',
      'Requisito de clientes/licitaciones'
    ],
    prerequisites: [
      'Compromiso de la dirección',
      'Recursos dedicados (20-40% de tiempo)',
      'Presupuesto para cambios necesarios'
    ],
    methodology: 'ISO 27001:2022, ISO 27002:2022, Anexo A completo',
    price: 'Consultoría: €15,000-€40,000. Auditoría certificación: €5,000-€10,000 adicionales',
    successStories: '50+ empresas certificadas, 100% de éxito en primera auditoría'
  },

  'Formación en Ciberseguridad': {
    fullDescription: 'Programas de capacitación personalizados para todos los niveles de tu organización, desde awareness básico hasta formación técnica avanzada. Incluye simulacros de phishing, talleres prácticos y certificaciones reconocidas.',
    benefits: [
      'Reducción del 90% en clicks de phishing',
      'Cultura de seguridad organizacional',
      'Cumplimiento de requisitos regulatorios',
      'Certificaciones profesionales incluidas',
      'Material personalizado para tu industria',
      'Métricas de mejora medibles'
    ],
    process: [
      { step: 'Evaluación', description: 'Assessment inicial de conocimientos (1 semana)' },
      { step: 'Diseño', description: 'Personalización del programa formativo (1-2 semanas)' },
      { step: 'Ejecución', description: 'Impartición de sesiones teórico-prácticas (4-12 semanas)' },
      { step: 'Práctica', description: 'Laboratorios y ejercicios hands-on (continuo)' },
      { step: 'Evaluación', description: 'Testing y certificación (al final de cada módulo)' },
      { step: 'Refuerzo', description: 'Microlearning y recordatorios (mensual)' }
    ],
    deliverables: [
      'Plan de formación anual',
      'Material didáctico personalizado',
      'Plataforma e-learning',
      'Certificados de completion',
      'Informes de progreso',
      'Simulacros de phishing mensuales'
    ],
    duration: 'Programas de 3, 6 o 12 meses',
    targetAudience: [
      'Todos los empleados (awareness)',
      'Equipos de TI (técnico)',
      'Directivos (estratégico)',
      'Desarrolladores (secure coding)'
    ],
    prerequisites: [
      'Lista de participantes',
      'Salas/plataforma para formación',
      'Tiempo asignado para formación'
    ],
    methodology: 'NIST NICE Framework, SANS Security Awareness',
    tools: [
      'KnowBe4',
      'Cybrary',
      'Laboratorios virtuales',
      'Simuladores de ataque'
    ],
    price: 'Awareness: €20-50/usuario/año. Técnico: €500-2000/persona',
    successStories: '10,000+ profesionales formados, 95% de satisfacción'
  },

  'Análisis de Vulnerabilidades': {
    fullDescription: 'Escaneo automatizado y análisis manual continuo de vulnerabilidades en infraestructura, aplicaciones y configuraciones. Incluye priorización basada en riesgo real y seguimiento hasta remediación.',
    benefits: [
      'Detección temprana de vulnerabilidades',
      'Priorización basada en CVSS y contexto',
      'Reducción del 80% en superficie de ataque',
      'Cumplimiento con patch management',
      'Visibilidad continua del riesgo',
      'Integración con CI/CD pipelines'
    ],
    process: [
      { step: 'Inventario', description: 'Descubrimiento de activos y clasificación (3-5 días)' },
      { step: 'Configuración', description: 'Setup de escáneres y credenciales (2-3 días)' },
      { step: 'Escaneo', description: 'Análisis automatizado recurrente (semanal/mensual)' },
      { step: 'Validación', description: 'Verificación manual de críticos (continuo)' },
      { step: 'Reporte', description: 'Dashboard y alertas automáticas (tiempo real)' },
      { step: 'Seguimiento', description: 'Tracking de remediación (continuo)' }
    ],
    deliverables: [
      'Dashboard en tiempo real',
      'Informes ejecutivos mensuales',
      'Alertas de vulnerabilidades críticas',
      'Tendencias y métricas KPI',
      'Guías de remediación',
      'API para integración'
    ],
    duration: 'Servicio continuo o evaluaciones puntuales',
    targetAudience: [
      'Empresas con múltiples sistemas',
      'Desarrollo de software',
      'Infraestructura cloud',
      'Cumplimiento PCI-DSS'
    ],
    prerequisites: [
      'Inventario de activos',
      'Ventanas de escaneo aprobadas',
      'Credenciales de acceso'
    ],
    methodology: 'OWASP, CWE, CVSS v3.1',
    tools: [
      'Qualys VMDR',
      'Tenable.io',
      'Rapid7 InsightVM',
      'OpenVAS'
    ],
    price: 'Puntual: €2,000-€5,000. Continuo: €500-€2,000/mes',
    successStories: 'Detección de 15,000+ vulnerabilidades/año, 99% remediadas en SLA'
  },

  'Desarrollo Seguro': {
    fullDescription: 'Implementación de prácticas DevSecOps y secure coding en tu ciclo de desarrollo. Incluye revisión de código, modelado de amenazas, y automatización de seguridad en CI/CD.',
    benefits: [
      'Reducción del 85% en vulnerabilidades en producción',
      'Ahorro de costos (100x más barato que fix en producción)',
      'Time-to-market más rápido y seguro',
      'Cumplimiento con OWASP SAMM',
      'Desarrolladores empoderados en seguridad',
      'Automatización de controles de seguridad'
    ],
    process: [
      { step: 'Assessment', description: 'Evaluación de madurez DevSecOps actual (1 semana)' },
      { step: 'Diseño', description: 'Arquitectura de pipeline seguro (2 semanas)' },
      { step: 'Implementación', description: 'Integración de herramientas SAST/DAST/SCA (2-4 semanas)' },
      { step: 'Training', description: 'Formación en secure coding (2-4 semanas)' },
      { step: 'Operación', description: 'Monitoreo y mejora continua (permanente)' },
      { step: 'Métricas', description: 'KPIs de seguridad en desarrollo (mensual)' }
    ],
    deliverables: [
      'Pipeline DevSecOps configurado',
      'Políticas de secure coding',
      'Threat modeling templates',
      'Security champions program',
      'Dashboards de seguridad',
      'Playbooks de remediación'
    ],
    duration: '2-3 meses implementación inicial',
    targetAudience: [
      'Equipos de desarrollo',
      'Empresas SaaS',
      'Fintechs y healthtech',
      'Transformación digital'
    ],
    prerequisites: [
      'CI/CD pipeline existente',
      'Acceso a repositorios',
      'Commitment del equipo dev'
    ],
    methodology: 'OWASP SAMM, DevSecOps Maturity Model, BSIMM',
    tools: [
      'SonarQube',
      'Checkmarx',
      'GitLab Security',
      'Snyk',
      'OWASP ZAP'
    ],
    price: 'Setup inicial: €10,000-€25,000. Mantenimiento: €1,000-€3,000/mes',
    successStories: '60% reducción en tiempo de fix, 90% detección pre-producción'
  }
};

export function ServiceInfoModal({ 
  isOpen, 
  onClose, 
  service, 
  onRequestService 
}: ServiceInfoModalProps) {
  const details = serviceDetails[service.title] || {
    fullDescription: 'Información detallada no disponible.',
    benefits: [],
    process: [],
    deliverables: [],
    duration: 'Por definir',
    targetAudience: [],
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assessment': return <Search className="h-5 w-5" />;
      case 'testing': return <Shield className="h-5 w-5" />;
      case 'managed': return <Users className="h-5 w-5" />;
      case 'incident': return <AlertTriangle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {getCategoryIcon(service.category)}
                {service.title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Información completa sobre este servicio de ciberseguridad
              </DialogDescription>
            </div>
            <Badge variant="outline" className="ml-4">
              {service.category}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 py-4 max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Descripción */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descripción
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {details.fullDescription}
              </p>
            </div>

            {/* Beneficios */}
            {details.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Beneficios Clave
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {details.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proceso */}
            {details.process.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Proceso de Trabajo
                </h3>
                <div className="space-y-3">
                  {details.process.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.step}</div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entregables */}
            {details.deliverables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Entregables
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <ul className="grid md:grid-cols-2 gap-2">
                    {details.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Duración */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duración Estimada
                </h4>
                <p className="text-sm text-muted-foreground">{details.duration}</p>
              </div>

              {/* Audiencia */}
              {details.targetAudience.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Ideal Para
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {details.targetAudience.map((audience, index) => (
                      <li key={index}>• {audience}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Metodología */}
            {details.methodology && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Metodología y Estándares
                </h4>
                <p className="text-sm text-muted-foreground">{details.methodology}</p>
              </div>
            )}

            {/* Precio */}
            {details.price && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Inversión
                </h4>
                <p className="text-sm text-muted-foreground">{details.price}</p>
              </div>
            )}

            {/* Success Stories */}
            {details.successStories && (
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Casos de Éxito
                </h4>
                <p className="text-sm text-muted-foreground">{details.successStories}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.open('https://api.whatsapp.com/send?phone=34919049788&text=Hola, me interesa obtener más información sobre ' + service.title, '_blank');
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Consultar por WhatsApp
              </Button>
              <Button onClick={onRequestService}>
                <Briefcase className="mr-2 h-4 w-4" />
                Solicitar Servicio
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}