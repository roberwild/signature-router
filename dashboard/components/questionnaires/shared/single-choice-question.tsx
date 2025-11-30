'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { cn } from '@workspace/ui/lib/utils';
import type { Question, QuestionOption } from '~/data/lead-qualification/default-questionnaire';

interface SingleChoiceQuestionProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  colorScheme?: (questionId: string, value: string, isSelected: boolean) => {
    border: string;
    bg: string;
    text: string;
    radio: string;
  };
  iconMap?: Record<string, React.ComponentType<{ className?: string }> | string>;
}

export function SingleChoiceQuestion({
  question,
  value,
  onChange,
  colorScheme,
  iconMap = {}
}: SingleChoiceQuestionProps): React.JSX.Element {
  const getDefaultColorScheme = (questionId: string, optionValue: string, isSelected: boolean) => {
    if (questionId === 'recent_incidents') {
      if (optionValue === 'urgent') {
        return {
          border: isSelected ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
          bg: isSelected ? 'bg-red-50 dark:bg-red-950/20' : '',
          text: isSelected ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-200',
          radio: 'bg-red-500'
        };
      }
      if (optionValue === 'resolved') {
        return {
          border: isSelected ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700',
          bg: isSelected ? 'bg-yellow-50 dark:bg-yellow-950/20' : '',
          text: isSelected ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-200',
          radio: 'bg-yellow-500'
        };
      }
      if (optionValue === 'preventive') {
        return {
          border: isSelected ? 'border-green-500' : 'border-gray-200 dark:border-gray-700',
          bg: isSelected ? 'bg-green-50 dark:bg-green-950/20' : '',
          text: isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200',
          radio: 'bg-green-500'
        };
      }
    }
    
    return {
      border: isSelected ? 'border-primary' : 'border-gray-200 dark:border-gray-700',
      bg: isSelected ? 'bg-primary/5' : '',
      text: isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-200',
      radio: 'bg-primary'
    };
  };

  const getColorScheme = colorScheme || getDefaultColorScheme;

  return (
    <RadioGroup
      value={value || ''}
      onValueChange={onChange}
      className="grid gap-3"
    >
      {question.options?.map((option: QuestionOption) => {
        const isSelected = value === option.value;
        const colors = getColorScheme(question.id, option.value, isSelected);
        const IconOrEmoji = iconMap[option.value];
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
              colors.border,
              colors.bg,
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
                  ? `border-primary ${colors.bg}` 
                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
              )}>
                {isSelected && (
                  <div className={cn("h-2.5 w-2.5 rounded-full", colors.radio)} />
                )}
              </div>
            </div>
            <div className="flex flex-1 items-center justify-between">
              <div className="space-y-1">
                <p className={cn("text-sm font-medium leading-none", colors.text)}>
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
}