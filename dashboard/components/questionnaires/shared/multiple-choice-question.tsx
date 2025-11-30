'use client';

import * as React from 'react';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Textarea } from '@workspace/ui/components/textarea';
import { cn } from '@workspace/ui/lib/utils';
import type { Question, QuestionOption } from '~/data/lead-qualification/default-questionnaire';

interface MultipleChoiceQuestionProps {
  question: Question;
  value?: string[];
  onChange: (value: string[]) => void;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  iconMap?: Record<string, React.ComponentType<{ className?: string }> | string>;
}

export function MultipleChoiceQuestion({
  question,
  value = [],
  onChange,
  otherText = '',
  onOtherTextChange,
  iconMap = {}
}: MultipleChoiceQuestionProps): React.JSX.Element {
  const hasOtherSelected = value.includes('other');

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v: string) => v !== optionValue));
      if (optionValue === 'other' && onOtherTextChange) {
        onOtherTextChange('');
      }
    }
  };

  const handleOtherTextChange = (text: string) => {
    if (onOtherTextChange) {
      onOtherTextChange(text);
    }
    if (text && !hasOtherSelected) {
      onChange([...value, 'other']);
    }
  };

  return (
    <div className="grid gap-3">
      {question.options?.map((option: QuestionOption) => {
        const isSelected = value.includes(option.value);
        const IconOrEmoji = iconMap[option.value];
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
                handleCheckboxChange(option.value, checked as boolean);
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
      
      {question.allow_other && (
        <label
          htmlFor={`checkbox-other-${question.id}`}
          className={cn(
            "relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-all",
            hasOtherSelected 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/30"
          )}
        >
          <Checkbox
            id={`checkbox-other-${question.id}`}
            checked={hasOtherSelected}
            onCheckedChange={(checked) => {
              handleCheckboxChange('other', checked as boolean);
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
              id={`other-text-${question.id}`}
              placeholder="Escribe aquí..."
              className="h-20 resize-none w-full"
              value={otherText}
              disabled={!hasOtherSelected}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              onFocus={() => {
                if (!hasOtherSelected) {
                  handleCheckboxChange('other', true);
                }
              }}
            />
          </div>
        </label>
      )}
    </div>
  );
}