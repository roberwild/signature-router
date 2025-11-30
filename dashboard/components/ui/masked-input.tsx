'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { CredentialMasker } from '~/lib/security/credential-masking';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  maskingType?: 'api-key' | 'password' | 'token' | 'email' | 'custom';
  placeholder?: string;
  isNewValue?: boolean; // True if this is a new value being entered
  showToggle?: boolean; // Whether to show the show/hide toggle
  autoMask?: boolean; // Whether to automatically mask on blur
  className?: string;
  disabled?: boolean;
}

export function MaskedInput({
  value = '',
  onChange,
  onBlur,
  maskingType = 'api-key',
  placeholder,
  isNewValue = false,
  showToggle = true,
  autoMask = true,
  className,
  disabled = false,
  ...props
}: MaskedInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track if the value has been modified
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Determine if we should show the masked version
  const shouldMask = !isFocused && !isVisible && !isNewValue && autoMask && internalValue && !isModified;

  // Get the display value
  const getDisplayValue = () => {
    if (!internalValue) return '';
    
    if (shouldMask) {
      switch (maskingType) {
        case 'api-key':
          return CredentialMasker.mask(internalValue, 4);
        case 'password':
          return CredentialMasker.mask(internalValue, 0);
        case 'token':
          return CredentialMasker.mask(internalValue, 6);
        case 'email':
          return CredentialMasker.maskEmail(internalValue);
        case 'custom':
          return CredentialMasker.mask(internalValue, 4);
        default:
          return CredentialMasker.mask(internalValue, 4);
      }
    }
    
    return internalValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setIsModified(true);
    onChange?.(newValue);
  };

  const handleFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // If the input was masked, clear it so user can enter new value
    if (shouldMask) {
      setInternalValue('');
      setIsModified(true);
      onChange?.('');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    // Focus the input after toggling
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const displayValue = getDisplayValue();
  const showEyeIcon = showToggle && internalValue && !isFocused;

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef}
        type={maskingType === 'password' && !isVisible ? 'password' : 'text'}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pr-10', className)}
        autoComplete="off"
      />
      
      {showEyeIcon && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={toggleVisibility}
          disabled={disabled}
          tabIndex={-1}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      )}
    </div>
  );
}

// Helper component for form field with masking
interface MaskedFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maskingType?: MaskedInputProps['maskingType'];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  description?: string;
  isNewValue?: boolean;
}

export function MaskedFormField({
  label,
  value,
  onChange,
  placeholder,
  maskingType = 'api-key',
  required = false,
  disabled = false,
  error,
  description,
  isNewValue = false,
}: MaskedFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <MaskedInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maskingType={maskingType}
        disabled={disabled}
        isNewValue={isNewValue}
        className={error ? 'border-red-500' : ''}
      />
      
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}