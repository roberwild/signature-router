'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Users,
  Zap,
  HelpCircle,
  CheckCircle,
  FileSearch,
  // Target
} from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';

import { Progress } from '@workspace/ui/components/progress';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Textarea } from '@workspace/ui/components/textarea';
// import { Badge } from '@workspace/ui/components/badge';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import type { OnboardingStepProps } from '~/components/onboarding/onboarding-step-props';
import { defaultQuestionnaire, type QuestionnaireConfig } from '~/data/lead-qualification/default-questionnaire';
import type { CompleteOnboardingSchema } from '~/schemas/onboarding/complete-onboarding-schema';

interface ExtendedOnboardingStepProps extends OnboardingStepProps {
  questionnaire?: QuestionnaireConfig;
}

// Icon mapping for different options
type IconComponent = React.ComponentType<{ className?: string }>;
const OPTION_ICONS: Record<string, IconComponent | string> = {
  // Main concern icons
  security_level: Shield,
  vulnerabilities: FileSearch,
  no_team: Users,
  incident_response: Zap,
  
  // Company size icons
  '1-10': '🏢',
  '11-50': '🏢',
  '51-200': '🏛️',
  '200+': '🌆',
  
  // IT team icons
  dedicated: '👥',
  small: '👤',
  external: '🔗',
  none: '❌',
  
  // Recent incidents icons
  urgent: '🚨',
  resolved: '✅',
  preventive: '🛡️',
  unsure: '❓',
  
  // Compliance icons
  gdpr: '🇪🇺',
  iso27001: '📜',
  ens: '🇪🇸',
  nis2: '🔐',
  pci: '💳',
  none_compliance: '—',
  
  // Sector icons
  finance: '💰',
  health: '🏥',
  retail: '🛒',
  tech: '💻',
  manufacturing: '🏭',
  education: '🎓',
  government: '🏛️',
  other: '📋'
};

// Color schemes for different answer types
const getOptionColorScheme = (questionId: string, value: string, isSelected: boolean) => {
  // For urgency/incidents questions
  if (questionId === 'recent_incidents') {
    if (value === 'urgent') {
      return {
        border: isSelected ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
        bg: isSelected ? 'bg-red-50 dark:bg-red-950/20' : '',
        text: isSelected ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200',
        radio: 'bg-red-500'
      };
    }
    if (value === 'resolved') {
      return {
        border: isSelected ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700',
        bg: isSelected ? 'bg-yellow-50 dark:bg-yellow-950/20' : '',
        text: isSelected ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-200',
        radio: 'bg-yellow-500'
      };
    }
    if (value === 'preventive') {
      return {
        border: isSelected ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
        bg: isSelected ? 'bg-green-50 dark:bg-green-950/20' : '',
        text: isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200',
        radio: 'bg-green-500'
      };
    }
  }
  
  // Default color scheme
  return {
    border: isSelected ? 'border-primary' : 'border-gray-200 dark:border-gray-700',
    bg: isSelected ? 'bg-primary/5' : '',
    text: isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-200',
    radio: 'bg-primary'
  };
};

export function OnboardingLeadQualificationStep({
  canNext: _canNext,
  loading,
  isLastStep: _isLastStep,
  handleNext,
  metadata: _metadata,
  questionnaire
}: ExtendedOnboardingStepProps): React.JSX.Element {
  const form = useFormContext<CompleteOnboardingSchema>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [responses, setResponses] = React.useState<Record<string, unknown>>({});
  const [startTime, _setStartTime] = React.useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = React.useState<number>(Date.now());
  const [timePerQuestion, setTimePerQuestion] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Use provided questionnaire or fallback to default
  const activeQuestionnaire = questionnaire || defaultQuestionnaire;
  const questions = activeQuestionnaire.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const requiredQuestions = questions.filter(q => q.required);
  const optionalQuestions = questions.filter(q => !q.required);
  const _isOnOptionalQuestions = currentQuestionIndex >= requiredQuestions.length;
  const _canSkipToEnd = false; // Simplified questionnaire - no skip needed

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Track time spent on current question
  React.useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Calculate text engagement score
  const calculateTextEngagementScore = React.useCallback((text: string) => {
    if (!text) return 0;
    
    let score = 10; // Base score for writing anything
    
    if (text.length > 50) score += 5;
    if (text.length > 200) score += 5;
    
    // Check for keywords (from scoring config)
    const keywords = {
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
    };
    
    const lowerText = text.toLowerCase();
    Object.entries(keywords).forEach(([keyword, points]) => {
      if (lowerText.includes(keyword)) {
        score += points;
      }
    });
    
    return Math.min(score, 50); // Cap at 50 points
  }, []);

  const handleNextQuestion = React.useCallback(async () => {
    if (!currentQuestion) return;

    const currentQuestionId = currentQuestion.id;
    const timeSpent = Date.now() - questionStartTime;

    // Record time spent on this question
    setTimePerQuestion(prev => ({
      ...prev,
      [currentQuestionId]: timeSpent
    }));

    // Save current response to form
    form.setValue('leadQualificationStep.responses', responses);
    form.setValue('leadQualificationStep.currentQuestionIndex', currentQuestionIndex);

    if (isLastQuestion) {
      // Calculate completion time
      const completionTime = Math.round((Date.now() - startTime) / 1000); // in seconds

      // Calculate text engagement score
      const textEngagementScore = calculateTextEngagementScore(String(responses.specific_needs || ''));

      // Prepare final data
      const finalData = {
        responses,
        currentQuestionIndex,
        completedRequired: true,
        skippedOptional: false,
        completionTime,
        timePerQuestion,
        questionsAnswered: Object.keys(responses).length,
        optionalAnswered: Object.keys(responses).filter(
          key => optionalQuestions.some(q => q.id === key)
        ).length,
        textEngagementScore, // Add text engagement score
        hasSpecificNeeds: !!responses.specific_needs && typeof responses.specific_needs === 'string' && responses.specific_needs.length > 10
      };

      form.setValue('leadQualificationStep', finalData);
      setIsSubmitting(true);

      // Move to next onboarding step (complete onboarding)
      await handleNext();
      setIsSubmitting(false);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [
    calculateTextEngagementScore,
    currentQuestion,
    currentQuestionIndex,
    form,
    isLastQuestion,
    handleNext,
    optionalQuestions,
    questionStartTime,
    responses,
    startTime,
    timePerQuestion
  ]);

  const handleBack = React.useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const _handleSkipOptional = React.useCallback(async () => {
    // Mark that optional questions were skipped
    const finalData = {
      responses,
      currentQuestionIndex,
      completedRequired: true,
      skippedOptional: true,
      completionTime: Math.round((Date.now() - startTime) / 1000),
      timePerQuestion,
      questionsAnswered: Object.keys(responses).length,
      optionalAnswered: 0
    };

    form.setValue('leadQualificationStep', finalData);
    setIsSubmitting(true);

    // Move to next onboarding step (complete onboarding)
    await handleNext();
    setIsSubmitting(false);
  }, [currentQuestionIndex, form, handleNext, responses, startTime, timePerQuestion]);

  const handleResponseChange = (value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  // Safety check - if no current question, something is wrong
  if (!currentQuestion || !questions || questions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Loading questions...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderQuestion = () => {
    const response = responses[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'single_choice':
        return (
          <RadioGroup
            value={typeof response === 'string' ? response : ''}
            onValueChange={handleResponseChange}
            className="grid gap-3"
          >
            {currentQuestion.options?.map((option) => {
              const isSelected = response === option.value;
              const colorScheme = getOptionColorScheme(currentQuestion.id, option.value, isSelected);
              const IconOrEmoji = OPTION_ICONS[option.value];
              const iconDisplay = typeof IconOrEmoji === 'string'
                ? IconOrEmoji
                : IconOrEmoji && typeof IconOrEmoji === 'function'
                  ? <IconOrEmoji className="h-5 w-5" />
                  : null;
              
              return (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "relative flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-4 transition-all",
                    colorScheme.border,
                    colorScheme.bg,
                    !isSelected && "hover:border-gray-300 hover:bg-gray-50/50 dark:hover:border-gray-600 dark:hover:bg-gray-800/30"
                  )}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="sr-only"
                  />
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected 
                        ? `border-primary ${colorScheme.bg}` 
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                    )}>
                      {isSelected && (
                        <div className={cn("h-2.5 w-2.5 rounded-full", colorScheme.radio)} />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div className="space-y-1">
                      <p className={cn("text-sm font-medium leading-none", colorScheme.text)}>
                        {option.label}
                      </p>
                      {option.service && (
                        <p className="text-xs text-muted-foreground">
                          Servicio recomendado: {option.service}
                        </p>
                      )}
                    </div>
                    {iconDisplay && (
                      <span className="ml-3 text-lg">{iconDisplay}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        );

      case 'multiple_choice': {
        const selectedValues = Array.isArray(response) ? response : [];
        const otherText = responses[`${currentQuestion.id}_other`] || '';
        const hasOtherSelected = selectedValues.includes('other');
        
        return (
          <div className="grid gap-3">
            {currentQuestion.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const IconOrEmoji = OPTION_ICONS[option.value];
              const iconDisplay = typeof IconOrEmoji === 'string'
                ? IconOrEmoji
                : IconOrEmoji && typeof IconOrEmoji === 'function'
                  ? <IconOrEmoji className="h-5 w-5" />
                  : null;
              
              return (
                <label
                  key={option.value}
                  htmlFor={`checkbox-${option.value}`}
                  className={cn(
                    "relative flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-4 transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/30"
                  )}
                >
                  <Checkbox
                    id={`checkbox-${option.value}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleResponseChange([...selectedValues, option.value]);
                      } else {
                        handleResponseChange(
                          selectedValues.filter((v: string) => v !== option.value)
                        );
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium leading-none",
                      isSelected ? "text-primary" : "text-gray-700 dark:text-gray-200"
                    )}>
                      {option.label}
                    </span>
                    {iconDisplay && (
                      <span className="ml-3 text-lg">{iconDisplay}</span>
                    )}
                  </div>
                </label>
              );
            })}
            {currentQuestion.allow_other && (
              <label
                htmlFor={`checkbox-other-${currentQuestion.id}`}
                className={cn(
                  "relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-all",
                  hasOtherSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/30"
                )}
              >
                <Checkbox
                  id={`checkbox-other-${currentQuestion.id}`}
                  checked={hasOtherSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Add 'other' to selected values if not already there
                      if (!hasOtherSelected) {
                        handleResponseChange([...selectedValues, 'other']);
                      }
                    } else {
                      // Remove 'other' from selected values and clear the text
                      handleResponseChange(
                        selectedValues.filter((v: string) => v !== 'other')
                      );
                      setResponses(prev => ({
                        ...prev,
                        [`${currentQuestion.id}_other`]: ''
                      }));
                    }
                  }}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                />
                <div className="flex-1 space-y-2">
                  <span className={cn(
                    "text-sm font-medium leading-none",
                    hasOtherSelected ? "text-primary" : "text-gray-700 dark:text-gray-200"
                  )}>
                    Otro (especificar)
                  </span>
                  <Textarea
                    id={`other-text-${currentQuestion.id}`}
                    placeholder="Escribe aquí..."
                    className="h-20 resize-none w-full"
                    value={typeof otherText === 'string' ? otherText : ''}
                    disabled={!hasOtherSelected}
                    onChange={(e) => {
                      const text = e.target.value;
                      setResponses(prev => ({
                        ...prev,
                        [`${currentQuestion.id}_other`]: text
                      }));
                      // Automatically select 'other' checkbox when user starts typing
                      if (text && !hasOtherSelected) {
                        handleResponseChange([...selectedValues, 'other']);
                      }
                    }}
                    onFocus={() => {
                      // Automatically select 'other' checkbox when text area is focused
                      if (!hasOtherSelected) {
                        handleResponseChange([...selectedValues, 'other']);
                      }
                    }}
                  />
                </div>
              </label>
            )}
          </div>
        );
      }

      case 'text_area':
        return (
          <Textarea
            placeholder={currentQuestion.placeholder || "Escribe tu respuesta aquí..."}
            className="min-h-[120px] resize-none"
            maxLength={currentQuestion.maxLength}
            value={typeof response === 'string' ? response : ''}
            onChange={(e) => handleResponseChange(e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  const isCurrentQuestionAnswered = !!responses[currentQuestion.id];
  const canProceed = !currentQuestion.required || isCurrentQuestionAnswered;

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Minimalist Progress Header */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                <span>{currentQuestion.required ? 'Obligatoria' : 'Opcional'}</span>
              </div>

              {/* Clean Progress Bar */}
              <Progress value={progress} className="h-2" />

              {/* Simple Step Dots */}
              <div className="flex justify-center gap-2">
                {questions.map((_, index) => {
                  const isCompleted = index < currentQuestionIndex;
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = responses[questions[index].id];

                  return (
                    <div
                      key={index}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all duration-200",
                        isCompleted || (isCurrent && isAnswered)
                          ? "bg-primary"
                          : isCurrent
                            ? "bg-primary/50"
                            : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {currentQuestionIndex + 1}
              </div>
              <div className="flex-1 space-y-1">
                <CardTitle className="text-lg">
                  {currentQuestion.question}
                  {currentQuestion.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </CardTitle>
                {!currentQuestion.required && (
                  <CardDescription>
                    Esta pregunta es opcional, pero nos ayuda a ofrecerte un mejor servicio
                  </CardDescription>
                )}
              </div>
              {currentQuestion.scoring_weight && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Esta pregunta ayuda a evaluar tu nivel de urgencia y necesidades específicas</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderQuestion()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
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
            {!currentQuestion.required && !isLastQuestion && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleNextQuestion}
                disabled={isSubmitting || loading}
              >
                Omitir
              </Button>
            )}
            
            <Button
              type="button"
              onClick={handleNextQuestion}
              disabled={!canProceed || isSubmitting || loading}
            >
              {(isSubmitting || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLastQuestion ? 'Finalizar' : 'Siguiente'}
              {!isLastQuestion && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Completion Information */}
        {isLastQuestion && currentQuestion.type === 'text_area' && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                <CheckCircle className="inline mr-2 h-4 w-4 text-green-500" />
                Última pregunta: Cuéntanos más detalles para ofrecerte una solución personalizada.
                Cuanto más específico seas, mejor podremos ayudarte.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}