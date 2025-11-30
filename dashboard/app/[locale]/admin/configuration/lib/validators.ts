export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  helpText?: string;
}

export interface ValidationRule {
  type: 'url' | 'email' | 'number' | 'boolean' | 'regex' | 'custom';
  validator: (value: string) => ValidationResult;
  errorMessage?: string;
  helpText?: string;
}

export type Validator = (value: string) => string | null;
export type AdvancedValidator = (value: string) => ValidationResult;

// URL validation
export const urlValidator: Validator = (value: string) => {
  if (!value) return 'URL is required';
  
  try {
    new URL(value);
    return null;
  } catch {
    return 'Invalid URL format';
  }
};

// Email validation
export const emailValidator: Validator = (value: string) => {
  if (!value) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : 'Invalid email format';
};

// Number validation
export const numberValidator: Validator = (value: string) => {
  if (!value) return 'Number is required';
  
  return isNaN(Number(value)) ? 'Must be a valid number' : null;
};

// Port number validation
export const portValidator: Validator = (value: string) => {
  if (!value) return 'Port is required';
  
  const port = Number(value);
  if (isNaN(port)) return 'Must be a valid number';
  if (port < 1 || port > 65535) return 'Port must be between 1 and 65535';
  
  return null;
};

// Boolean validation
export const booleanValidator: Validator = (value: string) => {
  const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
  return validValues.includes(value.toLowerCase()) 
    ? null 
    : 'Must be true/false, 1/0, or yes/no';
};

// JSON validation
export const jsonValidator: Validator = (value: string) => {
  if (!value) return 'JSON is required';
  
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'Invalid JSON format';
  }
};

// Get validator based on key pattern
export function getValidatorForKey(key: string): Validator | undefined {
  const keyLower = key.toLowerCase();
  
  // URL patterns
  if (keyLower.includes('url') || keyLower.includes('endpoint') || keyLower.includes('webhook')) {
    return urlValidator;
  }
  
  // Email patterns
  if (keyLower.includes('email') || keyLower.includes('mail')) {
    return emailValidator;
  }
  
  // Port patterns
  if (keyLower.includes('port')) {
    return portValidator;
  }
  
  // Boolean patterns
  if (keyLower.includes('enable') || keyLower.includes('disable') || 
      keyLower.includes('active') || keyLower.includes('debug') ||
      keyLower.startsWith('is_') || keyLower.startsWith('has_') ||
      keyLower.startsWith('use_') || keyLower.startsWith('allow_')) {
    return booleanValidator;
  }
  
  // Number patterns
  if (keyLower.includes('count') || keyLower.includes('limit') || 
      keyLower.includes('timeout') || keyLower.includes('interval') ||
      keyLower.includes('size') || keyLower.includes('max') || 
      keyLower.includes('min') || keyLower.includes('threshold')) {
    return numberValidator;
  }
  
  // JSON patterns
  if (keyLower.includes('json') || keyLower.includes('config') || 
      keyLower.includes('settings') || keyLower.includes('options')) {
    return jsonValidator;
  }
  
  return undefined;
}

// Advanced validators with detailed results
export const advancedUrlValidator: AdvancedValidator = (value: string) => {
  if (!value) {
    return {
      isValid: false,
      error: 'URL is required',
      suggestion: 'Enter a valid URL starting with http:// or https://',
      helpText: 'Example: https://api.example.com'
    };
  }

  try {
    const url = new URL(value);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: 'URL must use HTTP or HTTPS protocol',
        suggestion: `https://${url.host}${url.pathname}${url.search}`,
        helpText: 'Only HTTP and HTTPS protocols are supported'
      };
    }
    
    return { isValid: true, helpText: 'Valid URL format' };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
      suggestion: 'https://api.example.com/path',
      helpText: 'URL must include protocol, domain, and optional path'
    };
  }
};

export const advancedEmailValidator: AdvancedValidator = (value: string) => {
  if (!value) {
    return {
      isValid: false,
      error: 'Email is required',
      suggestion: 'Enter a valid email address',
      helpText: 'Example: user@example.com'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Handle comma-separated emails
  if (value.includes(',')) {
    const emails = value.split(',').map(e => e.trim()).filter(e => e);
    const invalid = emails.filter(e => !emailRegex.test(e));
    
    if (invalid.length > 0) {
      return {
        isValid: false,
        error: `Invalid email(s): ${invalid.join(', ')}`,
        suggestion: 'Use format: user1@example.com, user2@example.com',
        helpText: 'Separate multiple emails with commas'
      };
    }
    
    return { 
      isValid: true, 
      helpText: `Valid format with ${emails.length} email(s)` 
    };
  } else if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'Invalid email format',
      suggestion: 'user@example.com',
      helpText: 'Email must contain @ symbol and valid domain'
    };
  }
  
  return { isValid: true, helpText: 'Valid email format' };
};

export const advancedNumberValidator = (min?: number, max?: number): AdvancedValidator => {
  return (value: string) => {
    if (!value) {
      return {
        isValid: false,
        error: 'Number is required',
        suggestion: min !== undefined ? `Enter a number >= ${min}` : 'Enter a valid number',
        helpText: `${min !== undefined ? `Minimum: ${min}` : ''}${max !== undefined ? `, Maximum: ${max}` : ''}`
      };
    }

    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return {
        isValid: false,
        error: 'Value must be a number',
        suggestion: min !== undefined ? min.toString() : '100',
        helpText: 'Enter a numeric value (decimals allowed)'
      };
    }
    
    if (min !== undefined && num < min) {
      return {
        isValid: false,
        error: `Value must be at least ${min}`,
        suggestion: min.toString(),
        helpText: `Minimum allowed value: ${min}`
      };
    }
    
    if (max !== undefined && num > max) {
      return {
        isValid: false,
        error: `Value must be at most ${max}`,
        suggestion: max.toString(),
        helpText: `Maximum allowed value: ${max}`
      };
    }
    
    return { 
      isValid: true, 
      helpText: `Valid number${min !== undefined || max !== undefined ? ` (${min || '∞'} - ${max || '∞'})` : ''}` 
    };
  };
};

export const advancedBooleanValidator: AdvancedValidator = (value: string) => {
  const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
  const normalizedValue = value.toLowerCase();
  
  if (!validValues.includes(normalizedValue)) {
    return {
      isValid: false,
      error: 'Invalid boolean value',
      suggestion: 'true',
      helpText: 'Valid values: true, false, 1, 0, yes, no'
    };
  }
  
  const booleanValue = ['true', '1', 'yes'].includes(normalizedValue);
  return { 
    isValid: true, 
    helpText: `Boolean value: ${booleanValue ? 'True' : 'False'}` 
  };
};

export const advancedJsonValidator: AdvancedValidator = (value: string) => {
  if (!value) {
    return {
      isValid: false,
      error: 'JSON is required',
      suggestion: '{"key": "value"}',
      helpText: 'Enter valid JSON format'
    };
  }
  
  try {
    const parsed = JSON.parse(value);
    const type = Array.isArray(parsed) ? 'array' : typeof parsed;
    return { 
      isValid: true, 
      helpText: `Valid JSON ${type} format` 
    };
  } catch (_error) {
    return {
      isValid: false,
      error: 'Invalid JSON format',
      suggestion: '{"key": "value"}',
      helpText: 'JSON must be properly formatted with quotes around strings'
    };
  }
};

// Validation rule registry
export const validationRules: Record<string, ValidationRule> = {
  // URL patterns
  'API_ENDPOINT_URL': {
    type: 'url',
    validator: advancedUrlValidator,
    helpText: 'API endpoint URL with HTTP/HTTPS protocol'
  },
  'WEBHOOK_URL': {
    type: 'url',
    validator: advancedUrlValidator,
    helpText: 'Webhook URL for receiving notifications'
  },
  
  // Email patterns  
  'EMAIL_FROM': {
    type: 'email',
    validator: advancedEmailValidator,
    helpText: 'From email address for outgoing messages'
  },
  'ADMIN_EMAIL': {
    type: 'email',
    validator: advancedEmailValidator,
    helpText: 'Administrator email address'
  },
  'NOTIFICATION_EMAILS': {
    type: 'email',
    validator: advancedEmailValidator,
    helpText: 'Comma-separated list of notification emails'
  },
  
  // Number patterns with ranges
  'MAX_RETRY_COUNT': {
    type: 'number',
    validator: advancedNumberValidator(1, 100),
    helpText: 'Maximum retry attempts (1-100)'
  },
  'TIMEOUT_SECONDS': {
    type: 'number',
    validator: advancedNumberValidator(1, 3600),
    helpText: 'Timeout in seconds (1-3600)'
  },
  'PORT': {
    type: 'number',
    validator: advancedNumberValidator(1, 65535),
    helpText: 'Port number (1-65535)'
  },
  'MAX_FILE_SIZE_MB': {
    type: 'number',
    validator: advancedNumberValidator(1, 1000),
    helpText: 'Maximum file size in megabytes (1-1000)'
  },
  
  // Boolean patterns
  'DEBUG_MODE': {
    type: 'boolean',
    validator: advancedBooleanValidator,
    helpText: 'Enable or disable debug mode'
  },
  'EMAIL_ENABLED': {
    type: 'boolean',
    validator: advancedBooleanValidator,
    helpText: 'Enable or disable email functionality'
  },
  'AUTO_BACKUP': {
    type: 'boolean',
    validator: advancedBooleanValidator,
    helpText: 'Enable automatic backups'
  },
  
  // JSON patterns
  'API_CONFIG': {
    type: 'custom',
    validator: advancedJsonValidator,
    helpText: 'JSON configuration for API settings'
  },
  'FEATURE_FLAGS': {
    type: 'custom', 
    validator: advancedJsonValidator,
    helpText: 'JSON object with feature flag settings'
  }
};

// Get advanced validator for key
export function getAdvancedValidatorForKey(key: string): AdvancedValidator | undefined {
  // Check exact match first
  if (validationRules[key]) {
    return validationRules[key].validator;
  }
  
  // Check pattern matches
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('url') || keyLower.includes('endpoint') || keyLower.includes('webhook')) {
    return advancedUrlValidator;
  }
  
  if (keyLower.includes('email') || keyLower.includes('mail')) {
    return advancedEmailValidator;
  }
  
  if (keyLower.includes('port')) {
    return advancedNumberValidator(1, 65535);
  }
  
  if (keyLower.includes('timeout') || keyLower.includes('delay')) {
    return advancedNumberValidator(1, 3600);
  }
  
  if (keyLower.includes('count') || keyLower.includes('limit') || keyLower.includes('max') || keyLower.includes('min')) {
    return advancedNumberValidator(0, 999999);
  }
  
  if (keyLower.includes('enable') || keyLower.includes('disable') || keyLower.includes('debug') ||
      keyLower.startsWith('is_') || keyLower.startsWith('has_') || keyLower.startsWith('use_')) {
    return advancedBooleanValidator;
  }
  
  if (keyLower.includes('json') || keyLower.includes('config') || keyLower.includes('settings')) {
    return advancedJsonValidator;
  }
  
  return undefined;
}

// Get validation rule for key (including help text)
export function getValidationRuleForKey(key: string): ValidationRule | undefined {
  if (validationRules[key]) {
    return validationRules[key];
  }
  
  const validator = getAdvancedValidatorForKey(key);
  if (!validator) return undefined;
  
  // Create a basic rule for pattern-matched keys
  const keyLower = key.toLowerCase();
  let type: ValidationRule['type'] = 'custom';
  let helpText = 'Enter a valid value';
  
  if (keyLower.includes('url')) {
    type = 'url';
    helpText = 'Enter a valid URL with protocol';
  } else if (keyLower.includes('email')) {
    type = 'email';
    helpText = 'Enter a valid email address';
  } else if (keyLower.includes('port') || keyLower.includes('count') || keyLower.includes('timeout')) {
    type = 'number';
    helpText = 'Enter a numeric value';
  } else if (keyLower.includes('enable') || keyLower.includes('debug') || keyLower.startsWith('is_')) {
    type = 'boolean';
    helpText = 'Enter true or false';
  }
  
  return {
    type,
    validator,
    helpText
  };
}