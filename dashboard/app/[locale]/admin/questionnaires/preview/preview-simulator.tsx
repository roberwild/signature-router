'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { Progress } from '@workspace/ui/components/progress';
import { cn } from '@workspace/ui/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { QuestionnaireVersion } from '~/data/admin/questionnaires/get-questionnaire-configs';

interface PreviewSimulatorProps {
  questionnaire: QuestionnaireVersion;
  settings: {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    userCategory: string;
    simulateDelay: boolean;
    showDebugInfo: boolean;
    mockUserData: {
      name: string;
      email: string;
      organizationName: string;
      previousResponses: number;
    };
  };
  onResponse: (questionId: string, response: unknown) => void;
  isActive: boolean;
}

export function PreviewSimulator({ 
  questionnaire, 
  settings, 
  onResponse,
  isActive: _isActive
}: PreviewSimulatorProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questionnaire.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionnaire.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questionnaire.questions.length - 1;

  useEffect(() => {
    // Reset when questionnaire changes
    setCurrentQuestionIndex(0);
    setResponses({});
    setIsComplete(false);
  }, [questionnaire.id]);

  const handleNext = async () => {
    if (!currentQuestion) return;

    // Simulate network delay if enabled
    if (settings.simulateDelay) {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      setIsSubmitting(false);
    }

    // Log the response
    const response = responses[currentQuestion.id];
    onResponse(currentQuestion.id, response);

    if (isLastQuestion) {
      setIsComplete(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleResponseChange = (value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    const response = responses[currentQuestion.id];
    
    if (currentQuestion.required) {
      if (currentQuestion.type === 'multiple_choice') {
        return Array.isArray(response) && response.length > 0;
      }
      return response !== undefined && response !== '' && response !== null;
    }
    
    return true;
  };

  const getDeviceClasses = () => {
    switch (settings.deviceType) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  if (isComplete) {
    return (
      <Card className={cn(getDeviceClasses())}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Preview Complete!</h3>
            <p className="text-muted-foreground">
              All {questionnaire.questions.length} questions have been tested.
            </p>
            {settings.showDebugInfo && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <p className="text-sm font-medium mb-2">Debug Info:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(responses, null, 2)}
                </pre>
              </div>
            )}
            <Button 
              onClick={() => {
                setCurrentQuestionIndex(0);
                setResponses({});
                setIsComplete(false);
              }}
              className="mt-4"
            >
              Restart Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className={cn(getDeviceClasses())}>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(getDeviceClasses(), "space-y-4")}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questionnaire.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
            {currentQuestion.required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </CardTitle>
          {currentQuestion.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {currentQuestion.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Render question based on type */}
          {currentQuestion.type === 'single_choice' && currentQuestion.options && (
            <RadioGroup
              value={String(responses[currentQuestion.id] || '')}
              onValueChange={handleResponseChange}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={typeof option === 'string' ? option : option.value} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {typeof option === 'string' ? option : option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => {
                const currentResponses = Array.isArray(responses[currentQuestion.id]) ? responses[currentQuestion.id] as string[] : [];
                const optionValue = typeof option === 'string' ? option : option.value;

                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${index}`}
                      checked={currentResponses.includes(optionValue)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleResponseChange([...currentResponses, optionValue]);
                        } else {
                          handleResponseChange(currentResponses.filter((v: string) => v !== optionValue));
                        }
                      }}
                    />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {typeof option === 'string' ? option : option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {(currentQuestion.type === 'text' || currentQuestion.type === 'textarea') && (
            <Textarea
              placeholder="Enter your response..."
              value={String(responses[currentQuestion.id] || '')}
              onChange={(e) => handleResponseChange(e.target.value)}
              rows={currentQuestion.type === 'textarea' ? 4 : 2}
              className="w-full"
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : isLastQuestion ? (
                <>
                  Complete
                  <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {settings.showDebugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <p><strong>Question ID:</strong> {currentQuestion.id}</p>
              <p><strong>Type:</strong> {currentQuestion.type}</p>
              <p><strong>Required:</strong> {currentQuestion.required ? 'Yes' : 'No'}</p>
              <p><strong>Category:</strong> {currentQuestion.category}</p>
              <p><strong>Current Response:</strong> {JSON.stringify(responses[currentQuestion.id])}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}