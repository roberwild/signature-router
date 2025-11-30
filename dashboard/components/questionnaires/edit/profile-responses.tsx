'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { Separator } from '@workspace/ui/components/separator';
import { Edit2, Clock, ChevronRight, Target, Shield, Award } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ResponseEditModal } from './response-edit-modal';
import type { LeadProfile } from '../shared/types';
import type { Question } from '~/data/lead-qualification/default-questionnaire';
import { defaultQuestionnaire } from '~/data/lead-qualification/default-questionnaire';
import { 
  qualifiedLeadFollowUp, 
  technicalAssessment, 
  complianceDeepDive 
} from '~/data/lead-qualification/extended-questionnaires';

interface ProfileResponsesProps {
  lead: LeadProfile;
  onResponseEdit: (questionId: string, newValue: unknown) => Promise<void>;
  editHistory?: Array<{
    questionId: string;
    editedAt: Date;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

export function ProfileResponses({
  lead,
  onResponseEdit,
  editHistory = []
}: ProfileResponsesProps): React.JSX.Element {
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['initial'])
  );

  // Combine all responses
  const allResponses = {
    ...lead.initialResponses,
    ...lead.followUpResponses
  };

  // Get all questions grouped by section
  const questionSections = [
    {
      id: 'initial',
      title: 'Evaluación Inicial',
      description: 'Respuestas del cuestionario de onboarding',
      questions: defaultQuestionnaire.questions.slice(0, 6), // First 6 questions
      icon: Target
    },
    {
      id: 'qualified',
      title: 'Información de Calificación',
      description: 'Detalles sobre tu rol y presupuesto',
      questions: qualifiedLeadFollowUp,
      icon: Award
    },
    {
      id: 'technical',
      title: 'Evaluación Técnica',
      description: 'Información sobre tu infraestructura',
      questions: technicalAssessment,
      icon: Shield
    },
    {
      id: 'compliance',
      title: 'Cumplimiento y Regulación',
      description: 'Datos sensibles y auditorías',
      questions: complianceDeepDive,
      icon: Shield
    }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getQuestionResponse = (questionId: string) => {
    return allResponses[questionId];
  };

  const getLastEditDate = (questionId: string): Date | undefined => {
    const edits = editHistory.filter(e => e.questionId === questionId);
    if (edits.length > 0) {
      return edits[edits.length - 1].editedAt;
    }
    return undefined;
  };

  const handleEditClick = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleEditSave = async (newValue: unknown) => {
    if (editingQuestion) {
      await onResponseEdit(editingQuestion.id, newValue);
    }
  };

  // Calculate section completeness
  const getSectionCompleteness = (questions: Question[]) => {
    const answered = questions.filter(q => getQuestionResponse(q.id) !== undefined);
    return Math.round((answered.length / questions.length) * 100);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tu Perfil de Seguridad</CardTitle>
                <CardDescription>
                  Gestiona y actualiza tus respuestas del cuestionario
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{lead.profileCompleteness}%</div>
                <p className="text-xs text-muted-foreground">Completado</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={lead.profileCompleteness} className="h-2" />
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={lead.leadCategory === 'A1' ? 'default' : 'secondary'}>
                  Categoría {lead.leadCategory}
                </Badge>
                <span className="text-muted-foreground">
                  Puntuación: {lead.leadScore}/100
                </span>
              </div>
              {lead.lastEditAt && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    Última edición: {format(lead.lastEditAt, 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Sections */}
        {questionSections.map(section => {
          const SectionIcon = section.icon;
          const sectionCompleteness = getSectionCompleteness(section.questions);
          const isExpanded = expandedSections.has(section.id);
          const answeredCount = section.questions.filter(q => 
            getQuestionResponse(q.id) !== undefined
          ).length;

          return (
            <Card key={section.id}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SectionIcon className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {answeredCount}/{section.questions.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sectionCompleteness}% completo
                      </p>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {section.questions.map(question => {
                      const response = getQuestionResponse(question.id);
                      const lastEdit = getLastEditDate(question.id);
                      const hasResponse = response !== undefined && response !== null;

                      return (
                        <div 
                          key={question.id}
                          className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              {question.question}
                              {question.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              {hasResponse ? (
                                renderResponseValue(question, response)
                              ) : (
                                <span className="italic">Sin respuesta</span>
                              )}
                            </div>
                            {lastEdit && (
                              <p className="text-xs text-muted-foreground">
                                Editado: {format(lastEdit, "d 'de' MMMM", { locale: es })}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(question)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Edit History Summary */}
        {editHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Ediciones</CardTitle>
              <CardDescription>
                Has editado {editHistory.length} respuesta{editHistory.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editHistory.slice(-5).reverse().map((edit, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Pregunta editada
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(edit.editedAt, "d MMM yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <ResponseEditModal
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          question={editingQuestion}
          currentValue={getQuestionResponse(editingQuestion.id)}
          lastEditAt={getLastEditDate(editingQuestion.id)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}

function renderResponseValue(question: Question, value: unknown): React.ReactNode {
  if (!value) return null;

  switch (question.type) {
    case 'single_choice': {
      const option = question.options?.find(o => o.value === value);
      return option ? option.label : String(value);
    }

    case 'multiple_choice':
      if (!Array.isArray(value)) return String(value);
      return value.map(v => {
        const opt = question.options?.find(o => o.value === v);
        return opt?.label || v;
      }).join(', ');

    case 'text_area':
    case 'text': {
      const text = value.toString();
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }

    default:
      return JSON.stringify(value);
  }
}