'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onCancel?: () => void;
  validator?: (value: string) => string | null;
  placeholder?: string;
  className?: string;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  validator,
  placeholder = 'Enter value...',
  className = '',
}: InlineEditProps) {
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleValidation = (val: string) => {
    if (validator) {
      const validationError = validator(val);
      setError(validationError);
      return !validationError;
    }
    return true;
  };

  const handleSave = async () => {
    if (!handleValidation(editValue)) {
      return;
    }

    if (editValue === value) {
      onCancel?.();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    if (error) {
      handleValidation(e.target.value);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className={error ? 'border-destructive' : ''}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={isSaving || !!error}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}