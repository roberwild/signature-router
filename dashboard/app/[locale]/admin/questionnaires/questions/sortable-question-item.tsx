'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { Slider } from '@workspace/ui/components/slider';
import { Label } from '@workspace/ui/components/label';
import {
  GripVertical,
  Star,
  Eye,
  EyeOff,
  MessageSquare,
  ListOrdered,
  TextCursor,
  BarChart3
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { QuestionConfig } from '~/data/admin/questionnaires/get-question-configs';

interface SortableQuestionItemProps {
  question: QuestionConfig;
  onPriorityChange: (questionId: string, priority: number) => void;
  onToggleCritical: (questionId: string) => void;
  onToggleEnabled: (questionId: string) => void;
}

const questionTypeIcons = {
  single_choice: ListOrdered,
  multiple_choice: MessageSquare,
  text: TextCursor,
  scale: BarChart3
};

const priorityColors = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-green-600 bg-green-50 border-green-200'
};

export function SortableQuestionItem({
  question,
  onPriorityChange,
  onToggleCritical,
  onToggleEnabled
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const TypeIcon = questionTypeIcons[question.questionType as keyof typeof questionTypeIcons] || MessageSquare;
  
  const priorityLevel = question.priority >= 80 ? 'high' : question.priority >= 50 ? 'medium' : 'low';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'z-50'
      )}
    >
      <Card className={cn(
        'transition-all',
        isDragging && 'opacity-50',
        !question.enabled && 'opacity-60'
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              className="mt-1 cursor-grab touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Question Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {question.questionId}
                    </span>
                    {question.category && (
                      <Badge variant="outline" className="text-xs">
                        {question.category}
                      </Badge>
                    )}
                    {question.isCritical && (
                      <Badge variant="default" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Critical
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{question.questionText}</p>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${question.id}`} className="sr-only">
                    {question.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  {question.enabled ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    id={`enabled-${question.id}`}
                    checked={question.enabled}
                    onCheckedChange={() => onToggleEnabled(question.questionId)}
                  />
                </div>
              </div>

              {/* Priority and Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">
                    Priority:
                  </Label>
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <Slider
                      value={[question.priority]}
                      onValueChange={([value]) => onPriorityChange(question.questionId, value)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Badge 
                      variant="outline" 
                      className={cn('min-w-[3rem] justify-center', priorityColors[priorityLevel])}
                    >
                      {question.priority}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant={question.isCritical ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleCritical(question.questionId)}
                >
                  <Star className={cn(
                    'h-4 w-4',
                    question.isCritical && 'fill-current'
                  )} />
                  <span className="ml-2">{question.isCritical ? 'Critical' : 'Mark Critical'}</span>
                </Button>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Type: {question.questionType.replace('_', ' ')}</span>
                <span>Order: #{question.orderIndex + 1}</span>
                <span>Updated: {new Date(question.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}