'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { QuestionRenderer } from '../shared/question-renderer';
import type { Question } from '~/data/lead-qualification/default-questionnaire';

interface ResponseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  currentValue: unknown;
  lastEditAt?: Date;
  onSave: (newValue: unknown) => Promise<void>;
}

export function ResponseEditModal({
  isOpen,
  onClose,
  question,
  currentValue,
  lastEditAt,
  onSave
}: ResponseEditModalProps): React.JSX.Element {
  const [editedValue, setEditedValue] = React.useState(currentValue);
  const [otherText, setOtherText] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setEditedValue(currentValue);
      setOtherText('');
      setError(null);
    }
  }, [isOpen, currentValue]);

  const handleSave = async () => {
    // Validate required questions
    if (question.required && !editedValue) {
      setError('Esta pregunta es obligatoria');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedValue);
      onClose();
    } catch (_err) {
      setError('Error al guardar los cambios. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(editedValue) !== JSON.stringify(currentValue);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Respuesta</DialogTitle>
          <DialogDescription>
            Modifica tu respuesta a esta pregunta. Los cambios se guardarán en tu perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question display */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {question.question}
              {question.required && <span className="ml-1 text-red-500">*</span>}
            </h3>
            {!question.required && (
              <p className="text-xs text-muted-foreground">
                Esta pregunta es opcional
              </p>
            )}
          </div>

          {/* Last edit information */}
          {lastEditAt && (
            <Alert>
              <Clock className="h-4 w-4" />
              <div>
                <AlertTitle className="ml-6 mt-1">Última edición</AlertTitle>
                <AlertDescription className="mt-1">
                  Esta respuesta fue editada el{' '}
                  {format(lastEditAt, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Current value display */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Respuesta actual:
            </p>
            <div className="text-sm">
              {renderCurrentValue(question, currentValue)}
            </div>
          </div>

          {/* Edit interface */}
          <div className="border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Nueva respuesta:
            </p>
            <QuestionRenderer
              question={question}
              response={editedValue}
              onChange={setEditedValue}
              onOtherTextChange={setOtherText}
              otherText={otherText}
            />
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Changes indicator */}
          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tienes cambios sin guardar
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderCurrentValue(question: Question, value: unknown): React.ReactNode {
  if (!value) {
    return <span className="text-muted-foreground">Sin respuesta</span>;
  }

  switch (question.type) {
    case 'single_choice': {
      const option = question.options?.find(o => o.value === value);
      return option ? (
        <Badge variant="secondary">{option.label}</Badge>
      ) : (
        <span>{String(value)}</span>
      );
    }

    case 'multiple_choice':
      if (!Array.isArray(value) || value.length === 0) {
        return <span className="text-muted-foreground">Sin selección</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map(v => {
            const opt = question.options?.find(o => o.value === v);
            return (
              <Badge key={v} variant="secondary">
                {opt?.label || v}
              </Badge>
            );
          })}
        </div>
      );

    case 'text_area':
    case 'text':
      return <p className="whitespace-pre-wrap">{String(value)}</p>;

    default:
      return <span>{JSON.stringify(value)}</span>;
  }
}