'use client';

import * as React from 'react';
import { SingleChoiceQuestion } from './single-choice-question';
import { MultipleChoiceQuestion } from './multiple-choice-question';
import { TextAreaQuestion } from './text-area-question';
import type { QuestionRendererProps } from './types';

export function QuestionRenderer({
  question,
  response,
  onChange,
  onOtherTextChange,
  otherText
}: QuestionRendererProps): React.JSX.Element | null {
  switch (question.type) {
    case 'single_choice':
      return (
        <SingleChoiceQuestion
          question={question}
          value={response ? String(response) : undefined}
          onChange={onChange}
        />
      );

    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          value={Array.isArray(response) ? response : []}
          onChange={onChange}
          otherText={otherText}
          onOtherTextChange={onOtherTextChange}
        />
      );

    case 'text_area':
      return (
        <TextAreaQuestion
          question={question}
          value={response ? String(response) : undefined}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}