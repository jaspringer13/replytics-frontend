/**
 * Input Sanitization Service
 * Comprehensive XSS prevention and input sanitization with security-first approach
 * Implements OWASP guidelines for input validation and sanitization
 */

import { z } from 'zod';

export interface SanitizationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  allowUrls?: boolean;
  allowSpecialChars?: boolean;
  preserveLineBreaks?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    name: string;
  };
}

/**
 * Comprehensive Input Sanitization Service
 * Prevents XSS, injection attacks, and malicious content
 */
export class InputSanitizationService {
  
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const { preserveLineBreaks = false } = options;
    
    let sanitized = input
      // Basic HTML entity encoding
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // Additional security measures
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/\x08/g, '') // Remove backspace
      .replace(/\x0B/g, '') // Remove vertical tab
      .replace(/\x0C/g, '') // Remove form feed
      .replace(/\x0E/g, '') // Remove shift out
      .replace(/\x0F/g, ''); // Remove shift in

    // Handle line breaks
    if (preserveLineBreaks) {
      sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    } else {
      sanitized = sanitized.replace(/[\r\n\t]/g, ' ');
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Validate and sanitize general text input
   */
  validateTextInput(
    input: unknown, 
    options: SanitizationOptions = {}
  ): ValidationResult {
    const {
      maxLength = 10000,
      allowHtml = false,
      allowUrls = true,
      allowSpecialChars = true
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    if (input === null || input === undefined) {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Input cannot be null or undefined'],
        warnings
      };
    }

    if (typeof input !== 'string') {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Input must be a string'],
        warnings
      };
    }

    // Length validation
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Check for malicious patterns
    const maliciousPatterns = this.detectMaliciousPatterns(input);
    if (maliciousPatterns.length > 0) {
      errors.push(`Potentially malicious content detected: ${maliciousPatterns.join(', ')}`);
    }

    // Sanitize the input
    let sanitized = allowHtml ? input : this.sanitizeHtml(input, options);

    // URL validation if not allowed
    if (!allowUrls && this.containsUrls(sanitized)) {
      errors.push('URLs are not allowed in this input');
    }

    // Special character validation
    if (!allowSpecialChars && this.containsSpecialChars(sanitized)) {
      warnings.push('Input contains special characters that may be filtered');
      sanitized = this.removeSpecialChars(sanitized);
    }

    // Final sanitization
    sanitized = sanitized.trim();

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings
    };
  }

  /**
   * SQL injection prevention validator
   */
  validateQueryParameter(param: unknown): boolean {
    if (param === null || param === undefined) {
      return true; // Null values are safe
    }

    const paramStr = String(param).toLowerCase();
    
    // SQL injection patterns
    const suspiciousPatterns = [
      // SQL injection keywords
      /('|(\\')|(;)|(\\)|(--|#|\/\*|\*\/)|(\|\|))/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute|declare|cast|convert)/i,
      /(script|javascript|vbscript|onload|onerror|onclick|onmouseover)/i,
      // XSS patterns
      /(<script|<\/script|<iframe|<object|<embed|<link|<meta)/i,
      // Data URIs and protocols
      /(data:|javascript:|vbscript:|file:|ftp:)/i,
      // Control characters
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
      // Unicode control chars
      /[\u0000-\u001F\u007F-\u009F]/
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(paramStr));
  }

  /**
   * File upload validation with comprehensive security checks
   */
  validateFileUpload(file: File | { size: number; type: string; name: string }): FileValidationResult {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ];

    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', 
      '.js', '.jar', '.ps1', '.sh', '.php', '.asp', '.aspx'
    ];

    // Size validation
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` 
      };
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `File type '${file.type}' is not allowed` 
      };
    }

    // Extension validation
    const fileName = file.name.toLowerCase();
    const hasDangerousExtension = dangerousExtensions.some(ext => 
      fileName.endsWith(ext)
    );

    if (hasDangerousExtension) {
      return { 
        isValid: false, 
        error: 'File extension is not allowed for security reasons' 
      };
    }

    // Filename validation
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName.replace(/\.[^.]+$/, ''))) {
      return { 
        isValid: false, 
        error: 'Filename contains invalid characters' 
      };
    }

    return { 
      isValid: true,
      metadata: {
        size: file.size,
        type: file.type,
        name: file.name
      }
    };
  }

  /**
   * Email validation with comprehensive security checks  
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Email is required'],
        warnings
      };
    }

    // Basic sanitization
    const sanitized = email.trim().toLowerCase();

    // Length check
    if (sanitized.length > 254) { // RFC 5321 limit
      errors.push('Email address is too long');
    }

    // Pattern validation (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /vbscript/i,
      /[<>]/,
      /[\x00-\x1F\x7F]/
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(sanitized))) {
      errors.push('Email contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings
    };
  }

  /**
   * Phone number validation and sanitization
   */
  validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        sanitizedValue: '',
        errors: ['Phone number is required'],
        warnings
      };
    }

    // Remove common formatting characters
    let sanitized = phone.replace(/[\s\-\(\)\+\.]/g, '');

    // Check for suspicious patterns
    if (!/^\d{10,15}$/.test(sanitized)) {
      errors.push('Phone number must contain only digits and be 10-15 digits long');
    }

    // Add country code if missing (US default)
    if (sanitized.length === 10) {
      sanitized = '1' + sanitized;
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors,
      warnings
    };
  }

  /**
   * Detect malicious patterns in input
   */
  private detectMaliciousPatterns(input: string): string[] {
    const patterns = [
      { name: 'Script injection', regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi },
      { name: 'JavaScript protocol', regex: /javascript:/gi },
      { name: 'VBScript protocol', regex: /vbscript:/gi },
      { name: 'Data URI', regex: /data:text\/html/gi },
      { name: 'Event handler', regex: /on\w+\s*=/gi },
      { name: 'SQL injection', regex: /(union|select|insert|update|delete|drop)\s/gi },
      { name: 'Command injection', regex: /[;&|`$(){}]/g },
      { name: 'Path traversal', regex: /\.\.\/|\.\.\\|\.\.\//g }
    ];

    return patterns
      .filter(pattern => pattern.regex.test(input))
      .map(pattern => pattern.name);
  }

  /**
   * Check if input contains URLs
   */
  private containsUrls(input: string): boolean {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    return urlPattern.test(input);
  }

  /**
   * Check if input contains special characters
   */
  private containsSpecialChars(input: string): boolean {
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    return specialChars.test(input);
  }

  /**
   * Remove special characters from input
   */
  private removeSpecialChars(input: string): string {
    return input.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '');
  }
}

// Export singleton instance
export const inputSanitizer = new InputSanitizationService();

/**
 * Zod schema for common input validation
 */
export const SafeStringSchema = z.string()
  .min(1, 'Value cannot be empty')
  .max(10000, 'Value is too long')
  .refine(
    (val) => inputSanitizer.validateQueryParameter(val),
    'Value contains potentially dangerous content'
  );

export const SafeEmailSchema = z.string()
  .email('Invalid email format')
  .refine(
    (val) => {
      const result = inputSanitizer.validateEmail(val);
      return result.isValid;
    },
    'Email validation failed'
  );

export const SafePhoneSchema = z.string()
  .refine(
    (val) => {
      const result = inputSanitizer.validatePhoneNumber(val);
      return result.isValid;
    },
    'Phone number validation failed'
  );

/**
 * Request body sanitization
 */
export function sanitizeRequestBody(body: any): any {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized: any = Array.isArray(body) ? [] : {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const result = inputSanitizer.validateTextInput(value, {
        allowHtml: false,
        allowUrls: true,
        maxLength: 10000
      });
      sanitized[key] = result.sanitizedValue;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}