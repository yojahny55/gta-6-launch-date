/**
 * Centralized Error Handling Module
 *
 * Provides standardized error responses and error classes for the API.
 * Implements consistent error format per Architecture specification.
 *
 * Story 2.4: Input Validation and XSS Prevention
 * Architecture: Error Handling (lines 607-617)
 *
 * Standard Error Response Format:
 * {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'SERVER_ERROR',
 *     message: 'User-friendly message',
 *     field?: 'Optional field name'
 *   }
 * }
 */

/**
 * Error codes for standardized API responses
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'BOT_DETECTED';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Custom ValidationError class for input validation failures
 *
 * Extends built-in Error with field-specific context.
 * Used to identify validation errors specifically.
 *
 * @example
 * throw new ValidationError('Invalid date format', 'predicted_date');
 */
export class ValidationError extends Error {
  public readonly field?: string;
  public readonly code: ErrorCode = 'VALIDATION_ERROR';

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;

    // Maintain proper stack trace (only in V8 engines like Node.js)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Custom RateLimitError class for rate limiting violations
 *
 * @example
 * throw new RateLimitError('Too many requests from this IP');
 */
export class RateLimitError extends Error {
  public readonly code: ErrorCode = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';

    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, RateLimitError);
    }
  }
}

/**
 * Custom NotFoundError class for resource not found errors
 *
 * @example
 * throw new NotFoundError('Prediction not found for cookie ID');
 */
export class NotFoundError extends Error {
  public readonly code: ErrorCode = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';

    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Format a ValidationError into standardized error response
 *
 * @param {ValidationError} error - The validation error to format
 * @returns {ErrorResponse} Standardized error response object
 *
 * @example
 * const error = new ValidationError('Invalid date format', 'predicted_date');
 * formatErrorResponse(error);
 * // Returns:
 * // {
 * //   success: false,
 * //   error: {
 * //     code: 'VALIDATION_ERROR',
 * //     message: 'Invalid date format',
 * //     field: 'predicted_date'
 * //   }
 * // }
 */
export function formatErrorResponse(
  error: ValidationError | RateLimitError | NotFoundError | Error,
  defaultCode: ErrorCode = 'SERVER_ERROR'
): ErrorResponse {
  // Handle custom error classes
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
      },
    };
  }

  if (error instanceof RateLimitError || error instanceof NotFoundError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  // Handle generic errors
  return {
    success: false,
    error: {
      code: defaultCode,
      message: error.message || 'An unexpected error occurred',
    },
  };
}

/**
 * Format Zod validation errors into user-friendly error response
 *
 * Zod errors contain detailed path and issue information.
 * This function extracts the first error and formats it for the API.
 *
 * @param {import('zod').ZodError} zodError - Zod validation error
 * @returns {ErrorResponse} Standardized error response
 *
 * @example
 * import { z } from 'zod';
 * const schema = z.object({ date: z.string().min(1) });
 * try {
 *   schema.parse({ date: '' });
 * } catch (error) {
 *   return formatZodError(error);
 * }
 * // Returns:
 * // {
 * //   success: false,
 * //   error: {
 * //     code: 'VALIDATION_ERROR',
 * //     message: 'String must contain at least 1 character(s)',
 * //     field: 'date'
 * //   }
 * // }
 */
export function formatZodError(zodError: any): ErrorResponse {
  const firstError = zodError.errors?.[0];

  if (!firstError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
    };
  }

  // Extract field path (e.g., ['predicted_date'] or ['user', 'email'])
  const field = firstError.path?.join('.') || undefined;

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message || 'Validation failed',
      field,
    },
  };
}

/**
 * Log error with structured format for Cloudflare Workers
 *
 * Follows Architecture Logging Strategy (lines 640-670):
 * - Structured JSON format
 * - ISO 8601 timestamp
 * - Log level (INFO, WARN, ERROR)
 * - Context object with relevant data
 *
 * @param {Error} error - The error to log
 * @param {Record<string, unknown>} context - Additional context data
 *
 * @example
 * logError(new ValidationError('Invalid date', 'predicted_date'), {
 *   endpoint: '/api/predict',
 *   method: 'POST'
 * });
 */
export function logError(error: Error, context: Record<string, unknown> = {}): void {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
    })
  );
}
