interface NodeMailerConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  [key: string]: unknown;
}

interface ProviderApiConfig {
  apiKey?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  serverApiToken?: string;
  [key: string]: unknown;
}

type ProviderConfigRecord = NodeMailerConfig | ProviderApiConfig | Record<string, unknown>;

export class CredentialMasker {
  static mask(value: string | undefined | null, visibleChars: number = 4): string {
    if (!value || value.length === 0) {
      return '****';
    }
    
    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }
    
    const masked = '*'.repeat(value.length - visibleChars);
    const visible = value.slice(-visibleChars);
    return masked + visible;
  }
  
  static unmask(
    maskedValue: string,
    newValue: string,
    originalValue: string
  ): string {
    if (!newValue || newValue === maskedValue) {
      return originalValue;
    }
    
    if (maskedValue === this.mask(originalValue)) {
      return originalValue;
    }
    
    return newValue;
  }
  
  static isMasked(value: string): boolean {
    return value.includes('*') && value.length >= 4;
  }
  
  static shouldUpdateField(
    currentValue: string,
    newValue: string,
    originalValue: string
  ): boolean {
    if (!newValue) {
      return false;
    }
    
    if (this.isMasked(newValue) && newValue === this.mask(originalValue)) {
      return false;
    }
    
    return newValue !== currentValue;
  }
  
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '****';
    }
    
    const [localPart, domain] = email.split('@');
    
    if (localPart.length <= 3) {
      return '*'.repeat(localPart.length) + '@' + domain;
    }
    
    const visibleStart = localPart.slice(0, 2);
    const masked = '*'.repeat(Math.max(localPart.length - 2, 1));
    
    return visibleStart + masked + '@' + domain;
  }
  
  static maskUrl(url: string): string {
    if (!url) {
      return '****';
    }
    
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol;
      const hostname = urlObj.hostname;
      const port = urlObj.port ? `:${urlObj.port}` : '';
      const maskedPath = urlObj.pathname.length > 1 ? '/****' : '';
      
      return `${protocol}//${hostname}${port}${maskedPath}`;
    } catch {
      return this.mask(url, 10);
    }
  }
  
  static maskObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsToMask: (keyof T)[]
  ): T {
    const masked = { ...obj };
    
    for (const field of fieldsToMask) {
      if (masked[field]) {
        if (typeof masked[field] === 'string') {
          masked[field] = this.mask(masked[field] as string) as T[keyof T];
        }
      }
    }
    
    return masked;
  }
  
  static maskProviderConfig(provider: string, config: unknown): unknown {
    if (typeof config !== 'object' || config === null) {
      return config;
    }

    const configRecord = config as ProviderConfigRecord;
    const masked = { ...configRecord };
    
    switch (provider) {
      case 'nodemailer':
        if ('auth' in masked && masked.auth && typeof masked.auth === 'object') {
          const auth = masked.auth as { user?: string; pass?: string };
          if (auth.pass && typeof auth.pass === 'string') {
            auth.pass = this.mask(auth.pass);
          }
        }
        if ('host' in masked && typeof masked.host === 'string') {
          masked.host = this.maskUrl(masked.host);
        }
        break;

      case 'resend':
        if ('apiKey' in masked && typeof masked.apiKey === 'string') {
          masked.apiKey = this.mask(masked.apiKey, 6);
        }
        break;

      case 'sendgrid':
        if ('apiKey' in masked && typeof masked.apiKey === 'string') {
          masked.apiKey = this.mask(masked.apiKey, 6);
        }
        break;

      case 'aws_ses':
        if ('accessKeyId' in masked && typeof masked.accessKeyId === 'string') {
          masked.accessKeyId = this.mask(masked.accessKeyId, 4);
        }
        if ('secretAccessKey' in masked && typeof masked.secretAccessKey === 'string') {
          masked.secretAccessKey = this.mask(masked.secretAccessKey, 4);
        }
        break;
    }
    
    return masked;
  }
}

export class SecureFieldValidator {
  static isStrongPassword(password: string): boolean {
    if (password.length < 12) {
      return false;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
  
  static isValidApiKey(apiKey: string, provider: string): boolean {
    switch (provider) {
      case 'resend':
        return /^re_[a-zA-Z0-9]{20,}$/.test(apiKey);
        
      case 'sendgrid':
        return /^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/.test(apiKey);
        
      case 'aws_ses':
        return /^AK[A-Z0-9]{16,}$/.test(apiKey);
        
      default:
        return apiKey.length >= 20;
    }
  }
  
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
  
  static containsSensitiveData(text: string): boolean {
    const patterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /bearer/i,
      /private[_-]?key/i,
      /client[_-]?secret/i,
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }
}