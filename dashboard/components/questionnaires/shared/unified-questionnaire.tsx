'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Target, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

import { ProgressIndicator } from './progress-indicator';
import { QuestionCard } from './question-card';
import { QuestionRenderer } from './question-renderer';
import { calculateTextEngagementScore } from './scoring';
import type { QuestionnaireProps } from './types';

export function UnifiedQuestionnaire({
  questions,
  previousResponses = {},
  onComplete,
  onSave,
  isFollowUp = false,
  maxQuestionsPerSession = questions.length,
  currentQuestionIndex: initialIndex = 0,
  allowSkip = true,
  showProgress = true
}: QuestionnaireProps): React.JSX.Element {
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(initialIndex);
  const [responses, setResponses] = React.useState<Record<string, unknown>>(previousResponses);
  const [otherTextResponses, setOtherTextResponses] = React.useState<Record<string, string>>({});
  const [startTime] = React.useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = React.useState<number>(Date.now());
  const [timePerQuestion, setTimePerQuestion] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Limit questions per session if specified
  const sessionQuestions = questions.slice(0, Math.min(questions.length, maxQuestionsPerSession));
  const currentQuestion = sessionQuestions[currentQuestionIndex];

  const isLastQuestion = currentQuestionIndex === sessionQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const progress = ((currentQuestionIndex + 1) / sessionQuestions.length) * 100;

  React.useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleNextQuestion = React.useCallback(async () => {
    if (!currentQuestion) return;

    const timeSpent = Date.now() - questionStartTime;

    setTimePerQuestion(prev => ({
      ...prev,
      [currentQuestion.id]: timeSpent
    }));

    if (isLastQuestion) {
      const completionTime = Math.round((Date.now() - startTime) / 1000);
      const textEngagementScore = calculateTextEngagementScore(
        String(responses.specific_needs || '')
      );

      const finalData = {
        ...responses,
        ...otherTextResponses,
        _metadata: {
          completionTime,
          timePerQuestion,
          questionsAnswered: Object.keys(responses).length,
          textEngagementScore,
          isFollowUp
        }
      };

      setIsSubmitting(true);

      if (onComplete) {
        await onComplete(finalData);
      }

      setIsSubmitting(false);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [
    currentQuestion,
    isLastQuestion,
    onComplete,
    otherTextResponses,
    questionStartTime,
    responses,
    startTime,
    timePerQuestion,
    isFollowUp
  ]);

  const handleBack = React.useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleResponseChange = (value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Auto-save if callback provided
    if (onSave) {
      onSave(currentQuestion.id, value);
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherTextResponses(prev => ({
      ...prev,
      [`${currentQuestion.id}_other`]: text
    }));
  };

  if (!currentQuestion || sessionQuestions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No hay preguntas disponibles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCurrentQuestionAnswered = !!responses[currentQuestion.id];
  const canProceed = !currentQuestion.required || isCurrentQuestionAnswered;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {showProgress && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>
                    {isFollowUp ? 'Completa tu perfil' : 'Evaluación Rápida de Ciberseguridad'}
                  </CardTitle>
                  <CardDescription>
                    {isFollowUp 
                      ? 'Ayúdanos a conocerte mejor para ofrecerte soluciones personalizadas'
                      : `Solo ${sessionQuestions.length} preguntas para entender tus necesidades`
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                {Math.round(progress)}% completado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <ProgressIndicator
              current={currentQuestionIndex + 1}
              total={sessionQuestions.length}
              label="Pregunta"
              showPercentage={false}
            />
            {!isFollowUp && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Tiempo estimado: {Math.ceil(sessionQuestions.length / 6)} minuto{sessionQuestions.length > 6 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <QuestionCard
        questionNumber={currentQuestionIndex + 1}
        question={currentQuestion}
        showHelpTooltip={true}
      >
        <QuestionRenderer
          question={currentQuestion}
          response={responses[currentQuestion.id]}
          onChange={handleResponseChange}
          onOtherTextChange={handleOtherTextChange}
          otherText={otherTextResponses[`${currentQuestion.id}_other`]}
        />
      </QuestionCard>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting || isFirstQuestion}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Pregunta anterior
        </Button>

        <div className="flex gap-2">
          {allowSkip && !currentQuestion.required && !isLastQuestion && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleNextQuestion}
              disabled={isSubmitting}
            >
              Omitir
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleNextQuestion}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastQuestion ? 'Finalizar' : 'Siguiente'}
            {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isLastQuestion && currentQuestion.type === 'text_area' && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              <CheckCircle className="inline mr-2 h-4 w-4 text-green-500" />
              {isFollowUp 
                ? 'Última pregunta de esta sesión. Puedes continuar más tarde.'
                : 'Última pregunta: Cuéntanos más detalles para ofrecerte una solución personalizada.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}