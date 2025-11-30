'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type EvaluationRecord } from '../data/assessment-db';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '35%',
    color: '#666',
  },
  value: {
    fontSize: 10,
    width: '65%',
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  badge: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 3,
    marginLeft: 10,
  },
  excellentBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  goodBadge: {
    backgroundColor: '#eab308',
    color: '#fff',
  },
  regularBadge: {
    backgroundColor: '#f97316',
    color: '#fff',
  },
  lowBadge: {
    backgroundColor: '#ef4444',
    color: '#fff',
  },
  scoreBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '30%',
  },
  categoryBox: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  categoryScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 5,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  questionItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  questionNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  questionText: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  answerLabel: {
    fontSize: 9,
    color: '#666',
    marginRight: 10,
  },
  answerValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 10,
  },
  recommendationBox: {
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 3,
    marginBottom: 10,
    borderLeft: '3px solid #f59e0b',
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#78350f',
  },
  versionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

interface AssessmentPDFDocumentProps {
  assessment: EvaluationRecord;
  organizationSlug: string;
  userName?: string;
  userEmail?: string;
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'No especificada';
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
};

const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return 'No especificada';
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
};

const getScoreColor = (score: number | null) => {
  if (!score) return '#9ca3af';
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const getScoreBadgeStyle = (score: number | null) => {
  if (!score) return styles.regularBadge;
  if (score >= 80) return styles.excellentBadge;
  if (score >= 60) return styles.goodBadge;
  if (score >= 40) return styles.regularBadge;
  return styles.lowBadge;
};

const getScoreLabel = (score: number | null) => {
  if (!score) return 'No disponible';
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  return 'Bajo';
};

const getAnswerLabel = (score: number) => {
  switch(score) {
    case 1: return 'No implementado';
    case 2: return 'Parcialmente implementado';
    case 3: return 'Implementado';
    case 4: return 'Completamente implementado';
    default: return 'Sin respuesta';
  }
};

const getAnswerColor = (score: number) => {
  switch(score) {
    case 4: return '#10b981';
    case 3: return '#eab308';
    case 2: return '#f97316';
    case 1: return '#ef4444';
    default: return '#6b7280';
  }
};

// Question text mappings
const QUESTION_TEXT = {
  personas: {
    q1: 'Responsabilidad de la ciberseguridad en la empresa',
    q2: 'Compromiso de la dirección con la ciberseguridad',
    q3: 'Formación y concienciación de los empleados',
    q4: 'Comunicación y reporte de incidentes de seguridad',
    q5: 'Concienciación sobre amenazas (ej. phishing)',
  },
  procesos: {
    q1: 'Políticas internas de seguridad de la información',
    q2: 'Plan de respuesta a incidentes de ciberseguridad',
    q3: 'Copias de seguridad y recuperación de datos',
    q4: 'Cumplimiento de normativas y estándares de seguridad',
    q5: 'Evaluaciones de riesgo y auditorías de seguridad',
    q6: 'Plan de continuidad de negocio/recuperación ante desastres',
    q7: 'Control de accesos y gestión de cuentas de usuario',
  },
  tecnologias: {
    q1: 'Protección de la red (firewall y seguridad perimetral)',
    q2: 'Protección de los equipos (antivirus/antimalware)',
    q3: 'Actualización de sistemas y software (gestión de parches)',
    q4: 'Control de accesos y autenticación (contraseñas y 2FA)',
    q5: 'Protección de datos sensibles (cifrado)',
    q6: 'Monitorización y detección de amenazas',
    q7: 'Control de dispositivos y uso de equipos personales (BYOD)',
  },
};

export const AssessmentPDFDocument: React.FC<AssessmentPDFDocumentProps> = ({
  assessment,
  organizationSlug,
  userName,
  userEmail,
}) => {
  // Type-safe extraction of test data
  interface TestDataStructure {
    questionsAndAnswers?: {
      personas?: Array<{ question: string; answer: number | string; category?: string }>;
      procesos?: Array<{ question: string; answer: number | string; category?: string }>;
      tecnologias?: Array<{ question: string; answer: number | string; category?: string }>;
      [key: string]: Array<{ question: string; answer: number | string; category?: string }> | undefined;
    };
    personas?: Record<string, number | string>;
    procesos?: Record<string, number | string>;
    tecnologias?: Record<string, number | string>;
    nombre?: string;
    email?: string;
    sector?: string;
  }

  const testData = (assessment.testData as TestDataStructure | null) || {};

  // Build questions and answers array
  interface QuestionAnswer {
    section: string;
    question: string;
    answer: string | number;
    score: string | number;
  }

  const questionsAndAnswers: QuestionAnswer[] = [];

  if (testData.questionsAndAnswers) {
    // New format with structured questions
    const sections: Array<'personas' | 'procesos' | 'tecnologias'> = ['personas', 'procesos', 'tecnologias'];
    sections.forEach(section => {
      const sectionData = testData.questionsAndAnswers?.[section];
      if (sectionData && Array.isArray(sectionData)) {
        sectionData.forEach((item) => {
          if (item && typeof item === 'object' && 'question' in item && 'answer' in item) {
            questionsAndAnswers.push({
              section: section.charAt(0).toUpperCase() + section.slice(1),
              question: String(item.question),
              answer: item.answer,
              score: item.answer,
            });
          }
        });
      }
    });
  } else {
    // Fallback to old format
    const sections = ['personas', 'procesos', 'tecnologias'] as const;
    sections.forEach(section => {
      const sectionData = testData[section];
      if (sectionData && typeof sectionData === 'object') {
        Object.entries(sectionData).forEach(([key, value]) => {
          if (value) {
            const questionText = QUESTION_TEXT[section][key as keyof typeof QUESTION_TEXT[typeof section]] || `Pregunta ${key}`;
            questionsAndAnswers.push({
              section: section.charAt(0).toUpperCase() + section.slice(1),
              question: questionText,
              answer: value,
              score: value,
            });
          }
        });
      }
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.title}>
              Evaluación de Ciberseguridad
            </Text>
            <View style={[styles.badge, getScoreBadgeStyle(assessment.scoreTotal)]}>
              <Text style={{ color: '#fff', fontSize: 10 }}>
                {getScoreLabel(assessment.scoreTotal)}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Evaluación de madurez en ciberseguridad organizacional
          </Text>
          <View style={styles.versionInfo}>
            <Text style={{ fontSize: 10, color: '#666' }}>
              Organización: {organizationSlug}
            </Text>
            <Text style={{ fontSize: 10, color: '#666' }}>
              Fecha: {formatDate(assessment.createdAt)}
            </Text>
          </View>
        </View>

        {/* Overall Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Puntuación General</Text>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreText, { color: getScoreColor(assessment.scoreTotal) }]}>
              {assessment.scoreTotal ?? 'N/A'}%
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
              Nivel de Madurez: {getScoreLabel(assessment.scoreTotal)}
            </Text>
          </View>
        </View>

        {/* Category Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Puntuación por Categorías</Text>
          <View style={styles.grid}>
            <View style={styles.gridColumn}>
              <View style={styles.categoryBox}>
                <Text style={styles.categoryTitle}>Personas</Text>
                <Text style={[styles.categoryScore, { color: getScoreColor(assessment.scorePersonas) }]}>
                  {assessment.scorePersonas ?? 'N/A'}%
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${assessment.scorePersonas ?? 0}%`,
                      backgroundColor: getScoreColor(assessment.scorePersonas)
                    }
                  ]} />
                </View>
              </View>
            </View>
            
            <View style={styles.gridColumn}>
              <View style={styles.categoryBox}>
                <Text style={styles.categoryTitle}>Procesos</Text>
                <Text style={[styles.categoryScore, { color: getScoreColor(assessment.scoreProcesos) }]}>
                  {assessment.scoreProcesos ?? 'N/A'}%
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { 
                      width: `${assessment.scoreProcesos ?? 0}%`,
                      backgroundColor: getScoreColor(assessment.scoreProcesos)
                    }
                  ]} />
                </View>
              </View>
            </View>
            
            <View style={styles.gridColumn}>
              <View style={styles.categoryBox}>
                <Text style={styles.categoryTitle}>Sistemas</Text>
                <Text style={[styles.categoryScore, { color: getScoreColor(assessment.scoreSistemas) }]}>
                  {assessment.scoreSistemas ?? 'N/A'}%
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { 
                      width: `${assessment.scoreSistemas ?? 0}%`,
                      backgroundColor: getScoreColor(assessment.scoreSistemas)
                    }
                  ]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Evaluador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Evaluador:</Text>
            <Text style={styles.value}>{userName || testData.nombre || 'No especificado'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{userEmail || testData.email || 'No especificado'}</Text>
          </View>
          {testData.sector && (
            <View style={styles.row}>
              <Text style={styles.label}>Sector:</Text>
              <Text style={styles.value}>{testData.sector}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento generado automáticamente el {formatDateTime(new Date())}
          </Text>
          <Text>
            Evaluación basada en el marco de ciberseguridad del INCIBE y estándares ISO 27001
          </Text>
          <Text style={{ marginTop: 5, fontWeight: 'bold' }}>
            CONFIDENCIAL - Solo para uso interno de la organización
          </Text>
        </View>
      </Page>

      {/* Second page with detailed questions */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            Detalle de Respuestas
          </Text>
          <Text style={styles.subtitle}>
            Evaluación completa de las áreas de ciberseguridad
          </Text>
        </View>

        {/* Questions by Section */}
        {['Personas', 'Procesos', 'Tecnologías'].map((sectionName) => {
          const sectionQuestions = questionsAndAnswers.filter((q: QuestionAnswer) => {
            const normalizedSection = q.section.toLowerCase().replace('í', 'i');
            const normalizedName = sectionName.toLowerCase().replace('í', 'i');
            return normalizedSection === normalizedName;
          });

          if (sectionQuestions.length === 0) return null;

          return (
            <View key={sectionName} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionName}</Text>
              {sectionQuestions.map((item: QuestionAnswer, index: number) => (
                <View key={index} style={styles.questionItem}>
                  <Text style={styles.questionNumber}>
                    Pregunta {index + 1}
                  </Text>
                  <Text style={styles.questionText}>
                    {item.question}
                  </Text>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLabel}>Respuesta:</Text>
                    <Text style={[styles.answerValue, { color: getAnswerColor(Number(item.score)) }]}>
                      {getAnswerLabel(Number(item.score))} ({item.score}/4)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Página 2 - Detalle de respuestas
          </Text>
        </View>
      </Page>

      {/* Third page with recommendations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            Recomendaciones de Mejora
          </Text>
          <Text style={styles.subtitle}>
            Plan de acción sugerido basado en los resultados de la evaluación
          </Text>
        </View>

        {/* Recommendations by category */}
        {(assessment.scorePersonas ?? 0) < 60 && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>
              Área: Personas (Puntuación: {assessment.scorePersonas ?? 'N/A'}%)
            </Text>
            <Text style={styles.recommendationText}>
              • Implementar programas regulares de formación en ciberseguridad{'\n'}
              • Establecer políticas claras de seguridad para todos los empleados{'\n'}
              • Realizar simulacros de phishing y concienciación periódicos{'\n'}
              • Designar responsables de seguridad en cada departamento{'\n'}
              • Crear un canal de comunicación para reportar incidentes
            </Text>
          </View>
        )}

        {(assessment.scoreProcesos ?? 0) < 60 && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>
              Área: Procesos (Puntuación: {assessment.scoreProcesos ?? 'N/A'}%)
            </Text>
            <Text style={styles.recommendationText}>
              • Documentar procedimientos de respuesta a incidentes{'\n'}
              • Implementar auditorías de seguridad regulares{'\n'}
              • Establecer protocolos de gestión de accesos{'\n'}
              • Crear planes de continuidad del negocio{'\n'}
              • Desarrollar políticas de backup y recuperación
            </Text>
          </View>
        )}

        {(assessment.scoreSistemas ?? 0) < 60 && (
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>
              Área: Sistemas (Puntuación: {assessment.scoreSistemas ?? 'N/A'}%)
            </Text>
            <Text style={styles.recommendationText}>
              • Actualizar sistemas y aplicaciones regularmente{'\n'}
              • Implementar sistemas de detección de intrusiones (IDS/IPS){'\n'}
              • Configurar backups automáticos y cifrados{'\n'}
              • Utilizar autenticación multifactor (MFA) en todos los sistemas{'\n'}
              • Implementar cifrado de datos en reposo y en tránsito
            </Text>
          </View>
        )}

        {(assessment.scoreTotal ?? 0) >= 60 && (
          <View style={[styles.recommendationBox, { backgroundColor: '#d1fae5', borderLeftColor: '#10b981' }]}>
            <Text style={[styles.recommendationTitle, { color: '#065f46' }]}>
              Buen Nivel de Madurez
            </Text>
            <Text style={[styles.recommendationText, { color: '#047857' }]}>
              Su organización muestra un nivel adecuado de madurez en ciberseguridad.{'\n'}
              Continúe con las buenas prácticas actuales y considere:{'\n'}
              • Mantener actualizadas las políticas y procedimientos{'\n'}
              • Realizar evaluaciones periódicas (trimestrales){'\n'}
              • Buscar certificaciones como ISO 27001{'\n'}
              • Implementar mejora continua en todas las áreas
            </Text>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Pasos</Text>
          <Text style={styles.text}>
            1. Revisar las recomendaciones con el equipo de dirección{'\n'}
            2. Priorizar las áreas con puntuación más baja{'\n'}
            3. Establecer un plan de acción con plazos específicos{'\n'}
            4. Asignar recursos y responsables para cada mejora{'\n'}
            5. Programar una nueva evaluación en 3-6 meses{'\n'}
            6. Considerar contratar servicios especializados si es necesario
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Página 3 - Recomendaciones y plan de acción
          </Text>
          <Text style={{ marginTop: 5 }}>
            Para más información sobre ciberseguridad visite www.incibe.es
          </Text>
        </View>
      </Page>
    </Document>
  );
};