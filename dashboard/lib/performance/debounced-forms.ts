import { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';

// Generic debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced validation hook
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  isValidating: boolean;
}

export function useDebouncedValidation<T extends Record<string, unknown>>(
  values: T,
  schema: z.ZodSchema<T>,
  delay: number = 500
): ValidationResult {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    isValidating: false
  });

  const debouncedValues = useDebounce(values, delay);
  const validationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set validation as pending
    setValidationResult(prev => ({
      ...prev,
      isValidating: true
    }));

    // Validate after a short delay to prevent UI flicker
    validationTimeoutRef.current = setTimeout(() => {
      const result = schema.safeParse(debouncedValues);
      
      if (result.success) {
        setValidationResult({
          isValid: true,
          errors: {},
          isValidating: false
        });
      } else {
        const errors: Record<string, string[]> = {};
        
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(error.message);
        });

        setValidationResult({
          isValid: false,
          errors,
          isValidating: false
        });
      }
    }, 100); // Short delay to prevent flicker

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [debouncedValues, schema]);

  return validationResult;
}

// Debounced form hook
export interface DebouncedFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => Promise<void> | void;
  debounceDelay?: number;
  validateOnChange?: boolean;
}

export interface DebouncedFormState<T> {
  values: T;
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  dirtyFields: Set<string>;
}

export interface DebouncedFormActions<T> {
  setValue: (name: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  reset: (newValues?: T) => void;
  submit: () => Promise<void>;
  validateField: (name: keyof T) => void;
  clearErrors: () => void;
}

export function useDebouncedForm<T extends Record<string, unknown>>(
  options: DebouncedFormOptions<T>
): [DebouncedFormState<T>, DebouncedFormActions<T>] {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    debounceDelay = 500,
    validateOnChange = true
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const initialValuesRef = useRef(initialValues);

  // Update initial values ref when they change
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Debounced validation - always call the hook but conditionally use the result
  const defaultSchema: z.ZodSchema<T> = z.any() as unknown as z.ZodSchema<T>;
  const debouncedValidationResult = useDebouncedValidation(values, validationSchema || defaultSchema, debounceDelay);
  const validation = validationSchema && validateOnChange
    ? debouncedValidationResult
    : { isValid: true, errors: {}, isValidating: false };

  // Check if form is dirty
  const isDirty = Object.keys(values).some(
    key => values[key] !== initialValuesRef.current[key]
  );

  // Form actions
  const setValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setDirtyFields(prev => new Set(prev).add(name as string));
  }, []);

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
    setDirtyFields(prev => {
      const updated = new Set(prev);
      Object.keys(newValues).forEach(key => updated.add(key));
      return updated;
    });
  }, []);

  const reset = useCallback((newValues?: T) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setDirtyFields(new Set());
    if (newValues) {
      initialValuesRef.current = newValues;
    }
  }, [initialValues]);

  const validateField = useCallback(async (name: keyof T) => {
    if (!validationSchema) return;

    try {
      // Create a temporary object with just the field to validate
      const fieldValue = { [name]: values[name] } as Pick<T, keyof T>;
      validationSchema.parse(fieldValue);
    } catch (error) {
      // Field validation error handling would go here
      console.warn('Field validation error:', error);
    }
  }, [values, validationSchema]);

  const clearErrors = useCallback(() => {
    // This would clear any manual errors if we tracked them separately
  }, []);

  const submit = useCallback(async () => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      // Final validation before submit
      if (validationSchema) {
        validationSchema.parse(values);
      }
      
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, validationSchema]);

  const state: DebouncedFormState<T> = {
    values,
    errors: validation.errors,
    isValid: validation.isValid,
    isValidating: validation.isValidating,
    isSubmitting,
    isDirty,
    dirtyFields
  };

  const actions: DebouncedFormActions<T> = {
    setValue,
    setValues: setFormValues,
    reset,
    submit,
    validateField,
    clearErrors
  };

  return [state, actions];
}

// Debounced async validation hook for remote checks
export function useDebouncedAsyncValidation<T>(
  value: T,
  validator: (value: T) => Promise<{ isValid: boolean; error?: string }>,
  delay: number = 1000,
  dependencies: unknown[] = []
) {
  const [state, setState] = useState<{
    isValid: boolean;
    error?: string;
    isValidating: boolean;
  }>({
    isValid: true,
    isValidating: false
  });

  const debouncedValue = useDebounce(value, delay);
  const validationRef = useRef<Promise<unknown> | undefined>(undefined);

  useEffect(() => {
    // Skip validation for empty values
    if (!debouncedValue || (typeof debouncedValue === 'string' && debouncedValue.trim() === '')) {
      setState({ isValid: true, isValidating: false });
      return;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    const validation = validator(debouncedValue);
    validationRef.current = validation;

    validation
      .then((result) => {
        // Only update if this is still the latest validation
        if (validationRef.current === validation) {
          setState({
            isValid: result.isValid,
            error: result.error,
            isValidating: false
          });
        }
      })
      .catch((error) => {
        if (validationRef.current === validation) {
          setState({
            isValid: false,
            error: error.message || 'Validation failed',
            isValidating: false
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dependencies array is intentionally spread here
  }, [debouncedValue, validator, ...dependencies]);

  return state;
}

// Utility function to create field-specific validation schemas
export function createFieldValidator<T>(
  schema: z.ZodSchema<T>,
  fieldName: keyof T
): (value: T[keyof T]) => boolean {
  return (value: T[keyof T]) => {
    try {
      // Create a temporary object with just the field to validate
      const fieldValue = { [fieldName]: value } as Pick<T, keyof T>;
      schema.parse(fieldValue);
      return true;
    } catch {
      return false;
    }
  };
}

// Example usage schemas
export const emailValidationSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535, 'Port must be between 1 and 65535'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().min(1, 'From name is required'),
  use_tls: z.boolean(),
  is_active: z.boolean()
});

export const bulkToggleSchema = z.object({
  toggles: z.array(z.object({
    feature: z.string(),
    enabled: z.boolean()
  })),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  applyToAll: z.boolean()
});