/**
 * Error Handler Module Test Suite
 *
 * Tests for centralized error handling functions and custom error classes.
 * Story 2.4: Input Validation and XSS Prevention
 *
 * Coverage target: 100% (per ADR-011 mandatory testing requirement)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  ValidationError,
  RateLimitError,
  NotFoundError,
  formatErrorResponse,
  formatZodError,
  logError,
} from './error-handler';
import { z } from 'zod';

describe('ValidationError Class', () => {
  it('should create ValidationError with message only', () => {
    const error = new ValidationError('Invalid input');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Invalid input');
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.field).toBeUndefined();
  });

  it('should create ValidationError with message and field', () => {
    const error = new ValidationError('Invalid date format', 'predicted_date');
    expect(error.message).toBe('Invalid date format');
    expect(error.field).toBe('predicted_date');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have proper error name', () => {
    const error = new ValidationError('Test error');
    expect(error.name).toBe('ValidationError');
  });

  it('should have stack trace', () => {
    const error = new ValidationError('Test error');
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});

describe('RateLimitError Class', () => {
  it('should create RateLimitError with message', () => {
    const error = new RateLimitError('Too many requests');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.message).toBe('Too many requests');
    expect(error.name).toBe('RateLimitError');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should have proper error name', () => {
    const error = new RateLimitError('Rate limit exceeded');
    expect(error.name).toBe('RateLimitError');
  });

  it('should have stack trace', () => {
    const error = new RateLimitError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('NotFoundError Class', () => {
  it('should create NotFoundError with message', () => {
    const error = new NotFoundError('Resource not found');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.message).toBe('Resource not found');
    expect(error.name).toBe('NotFoundError');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should have proper error name', () => {
    const error = new NotFoundError('Prediction not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('should have stack trace', () => {
    const error = new NotFoundError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('formatErrorResponse - ValidationError', () => {
  it('should format ValidationError without field', () => {
    const error = new ValidationError('Invalid input');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Invalid input');
    expect(response.error.field).toBeUndefined();
  });

  it('should format ValidationError with field', () => {
    const error = new ValidationError('Invalid date format', 'predicted_date');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Invalid date format');
    expect(response.error.field).toBe('predicted_date');
  });

  it('should format ValidationError with different field', () => {
    const error = new ValidationError('Invalid UUID', 'cookie_id');
    const response = formatErrorResponse(error);

    expect(response.error.field).toBe('cookie_id');
  });
});

describe('formatErrorResponse - RateLimitError', () => {
  it('should format RateLimitError', () => {
    const error = new RateLimitError('Too many requests from this IP');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.error.message).toBe('Too many requests from this IP');
    expect(response.error.field).toBeUndefined();
  });

  it('should format RateLimitError with custom message', () => {
    const error = new RateLimitError('Rate limit exceeded for endpoint');
    const response = formatErrorResponse(error);

    expect(response.error.message).toBe('Rate limit exceeded for endpoint');
  });
});

describe('formatErrorResponse - NotFoundError', () => {
  it('should format NotFoundError', () => {
    const error = new NotFoundError('Prediction not found for cookie ID');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('NOT_FOUND');
    expect(response.error.message).toBe('Prediction not found for cookie ID');
    expect(response.error.field).toBeUndefined();
  });

  it('should format NotFoundError with custom message', () => {
    const error = new NotFoundError('Resource does not exist');
    const response = formatErrorResponse(error);

    expect(response.error.message).toBe('Resource does not exist');
  });
});

describe('formatErrorResponse - Generic Error', () => {
  it('should format generic Error with default code', () => {
    const error = new Error('Database connection failed');
    const response = formatErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('SERVER_ERROR');
    expect(response.error.message).toBe('Database connection failed');
    expect(response.error.field).toBeUndefined();
  });

  it('should format generic Error with custom default code', () => {
    const error = new Error('Something went wrong');
    const response = formatErrorResponse(error, 'VALIDATION_ERROR');

    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Something went wrong');
  });

  it('should handle Error with empty message', () => {
    const error = new Error('');
    const response = formatErrorResponse(error);

    expect(response.error.message).toBe('An unexpected error occurred');
  });

  it('should handle Error without message', () => {
    const error = new Error();
    const response = formatErrorResponse(error);

    expect(response.error.message).toBe('An unexpected error occurred');
  });
});

describe('formatZodError - Zod Validation Errors', () => {
  it('should format Zod string validation error', () => {
    const schema = z.string().min(1);
    try {
      schema.parse('');
    } catch (error) {
      const response = formatZodError(error);
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toContain('String must contain at least 1');
    }
  });

  it('should format Zod object field error with field name', () => {
    const schema = z.object({
      predicted_date: z.string().min(1),
    });
    try {
      schema.parse({ predicted_date: '' });
    } catch (error) {
      const response = formatZodError(error);
      expect(response.error.field).toBe('predicted_date');
    }
  });

  it('should format Zod regex error', () => {
    const schema = z.string().regex(/^\d+$/);
    try {
      schema.parse('abc');
    } catch (error) {
      const response = formatZodError(error);
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should format Zod number validation error', () => {
    const schema = z.number().min(0).max(100);
    try {
      schema.parse(150);
    } catch (error) {
      const response = formatZodError(error);
      expect(response.error.message).toContain('Number must be less than or equal to 100');
    }
  });

  it('should format Zod required field error', () => {
    const schema = z.object({
      required_field: z.string(),
    });
    try {
      schema.parse({});
    } catch (error) {
      const response = formatZodError(error);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.field).toBe('required_field');
    }
  });

  it('should handle Zod error with nested path', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });
    try {
      schema.parse({ user: { email: 'invalid' } });
    } catch (error) {
      const response = formatZodError(error);
      expect(response.error.field).toBe('user.email');
    }
  });

  it('should handle Zod error without errors array', () => {
    const zodError = { errors: undefined };
    const response = formatZodError(zodError);

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.message).toBe('Validation failed');
  });

  it('should handle Zod error with empty errors array', () => {
    const zodError = { errors: [] };
    const response = formatZodError(zodError);

    expect(response.error.message).toBe('Validation failed');
  });

  it('should handle Zod error without message', () => {
    const zodError = { errors: [{ path: ['field'], message: undefined }] };
    const response = formatZodError(zodError);

    expect(response.error.message).toBe('Validation failed');
  });
});

describe('logError - Structured Logging', () => {
  it('should log error with structured format', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Test error');
    logError(error);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.level).toBe('ERROR');
    expect(loggedData.message).toBe('Test error');
    expect(loggedData.name).toBe('Error');
    expect(loggedData.timestamp).toBeDefined();
    expect(loggedData.stack).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('should log error with context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new ValidationError('Invalid input', 'predicted_date');
    const context = {
      endpoint: '/api/predict',
      method: 'POST',
      userId: '123',
    };
    logError(error, context);

    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.context).toEqual(context);
    expect(loggedData.context.endpoint).toBe('/api/predict');
    expect(loggedData.context.method).toBe('POST');

    consoleSpy.mockRestore();
  });

  it('should log error without context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new RateLimitError('Too many requests');
    logError(error);

    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.context).toEqual({});
    expect(loggedData.message).toBe('Too many requests');

    consoleSpy.mockRestore();
  });

  it('should log error with ISO 8601 timestamp', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Test error');
    logError(error);

    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    consoleSpy.mockRestore();
  });

  it('should log ValidationError with field in context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new ValidationError('Invalid format', 'email');
    logError(error, { field: error.field });

    const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(loggedData.context.field).toBe('email');

    consoleSpy.mockRestore();
  });
});

describe('Error Response Format Compliance', () => {
  it('should match Architecture standard error response format', () => {
    const error = new ValidationError('Invalid date format', 'predicted_date');
    const response = formatErrorResponse(error);

    // Verify structure matches Architecture specification
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
    expect(response.error).toHaveProperty('field');

    expect(response.success).toBe(false);
    expect(typeof response.error.code).toBe('string');
    expect(typeof response.error.message).toBe('string');
  });

  it('should support all error codes from Architecture', () => {
    const codes = [
      'VALIDATION_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'NOT_FOUND',
      'SERVER_ERROR',
      'BOT_DETECTED',
    ];

    codes.forEach((code) => {
      let error: any;
      switch (code) {
        case 'VALIDATION_ERROR':
          error = new ValidationError('Test');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          error = new RateLimitError('Test');
          break;
        case 'NOT_FOUND':
          error = new NotFoundError('Test');
          break;
        default:
          error = new Error('Test');
      }

      const response = formatErrorResponse(error, code as any);
      expect([
        'VALIDATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'NOT_FOUND',
        'SERVER_ERROR',
        'BOT_DETECTED',
      ]).toContain(response.error.code);
    });
  });
});
