'use client';

import * as React from 'react';
import { Textarea } from '@workspace/ui/components/textarea';
import type { Question } from '~/data/lead-qualification/default-questionnaire';

interface TextAreaQuestionProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
}

export function TextAreaQuestion({
  question,
  value = '',
  onChange
}: TextAreaQuestionProps): React.JSX.Element {
  return (
    <Textarea
      placeholder={question.placeholder || "Escribe tu respuesta aquí..."}
      className="min-h-[120px] resize-none"
      maxLength={question.maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}