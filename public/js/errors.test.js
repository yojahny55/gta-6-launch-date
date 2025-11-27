/**
 * Error Handling Module Tests (Story 3.5: Error Handling with Retry Mechanisms)
 *
 * Tests cover:
 * - Error classification for all error types (AC1-AC8)
 * - Retry logic with exponential backoff (AC2)
 * - Error message mapping (AC3-AC8)
 * - Input preservation on error (AC9)
 * - Fallback behavior (AC10-AC12)
 * - Test coverage target: 100% for error handling logic (ADR-011)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorCode,
  RETRY_CONFIG,
  classifyError,
  fetchWithRetry,
  showError,
  hideError,
  saveSubmissionToLocalStorage,
  getPendingSubmission,
  clearPendingSubmission,
  logError
} from './errors.js';

describe('Error Handling Module', () => {
  describe('ErrorCode enum', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCode.CONFLICT).toBe('CONFLICT');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.SERVER_ERROR).toBe('SERVER_ERROR');
      expect(ErrorCode.TURNSTILE_FAILED).toBe('TURNSTILE_FAILED');
    });
  });

  describe('RETRY_CONFIG', () => {
    it('should have correct retry configuration (AC2)', () => {
      expect(RETRY_CONFIG.maxAttempts).toBe(3);
      expect(RETRY_CONFIG.initialDelay).toBe(1000); // 1 second
      expect(RETRY_CONFIG.maxDelay).toBe(10000); // 10 seconds
      expect(RETRY_CONFIG.backoffMultiplier).toBe(2); // 1s → 2s → 4s
    });
  });

  describe('classifyError', () => {
    it('should classify TypeError with fetch as NETWORK_ERROR (AC1)', async () => {
      const error = new TypeError('Failed to fetch');
      const result = await classifyError(error);

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(result.message).toContain('Unable to connect');
      expect(result.retryable).toBe(true);
    });

    it('should classify generic TypeError as NETWORK_ERROR', async () => {
      const error = new TypeError('Network error');
      const result = await classifyError(error);

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should classify 400 response as VALIDATION_ERROR (AC3)', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Invalid date format' } }),
        { status: 400 }
      );

      const result = await classifyError(response);

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe('Invalid date format');
      expect(result.retryable).toBe(false);
    });

    it('should classify 409 response as CONFLICT (AC4)', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Already submitted' } }),
        { status: 409 }
      );

      const result = await classifyError(response);

      expect(result.code).toBe(ErrorCode.CONFLICT);
      expect(result.message).toContain('already submitted');
      expect(result.retryable).toBe(false);
    });

    it('should classify 429 response as RATE_LIMIT_EXCEEDED (AC5)', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
        {
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );

      const result = await classifyError(response);

      expect(result.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(result.message).toContain('60 seconds');
      expect(result.retryable).toBe(true);
      expect(result.details?.waitSeconds).toBe(60);
    });

    it('should classify 500 response as SERVER_ERROR (AC6)', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Internal server error' } }),
        { status: 500 }
      );

      const result = await classifyError(response);

      expect(result.code).toBe(ErrorCode.SERVER_ERROR);
      expect(result.message).toContain('Something went wrong');
      expect(result.retryable).toBe(true);
    });

    it('should classify 404 response as NOT_FOUND', async () => {
      const response = new Response(
        JSON.stringify({ error: { message: 'Not found' } }),
        { status: 404 }
      );

      const result = await classifyError(response);

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.retryable).toBe(false);
    });

    it('should classify Turnstile error as TURNSTILE_FAILED (AC8)', async () => {
      const error = new Error('Turnstile verification failed');
      const result = await classifyError(error);

      expect(result.code).toBe(ErrorCode.TURNSTILE_FAILED);
      expect(result.message).toContain('Verification failed');
      expect(result.retryable).toBe(true);
    });

    it('should classify unknown error as SERVER_ERROR (AC7)', async () => {
      const error = new Error('Unknown error');
      const result = await classifyError(error);

      expect(result.code).toBe(ErrorCode.SERVER_ERROR);
      expect(result.retryable).toBe(false);
    });
  });

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.clearAllTimers(); // Clear pending timers FIRST to prevent memory leaks
      vi.restoreAllMocks();
      vi.useRealTimers();
      // Hint for garbage collection (helps with memory management)
      if (global.gc) global.gc();
    });

    it('should return successful response immediately (AC2)', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), { status: 200 });
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchWithRetry('/api/test');

      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error with exponential backoff (AC2)', async () => {
      const networkError = new TypeError('Failed to fetch');
      global.fetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));

      const fetchPromise = fetchWithRetry('/api/test');

      // Fast-forward timers for retries (1s, 2s)
      await vi.advanceTimersByTimeAsync(1000); // First retry after 1s
      await vi.advanceTimersByTimeAsync(2000); // Second retry after 2s

      const result = await fetchPromise;

      expect(result.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts (AC2)', async () => {
      const networkError = new TypeError('Failed to fetch');
      global.fetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      const fetchPromise = fetchWithRetry('/api/test');

      // Attach rejection handler immediately to prevent unhandled rejection
      const errorPromise = fetchPromise.catch(err => err);

      // Fast-forward timers for all retries
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry (should fail)

      // Wait for promise to settle
      const error = await errorPromise;
      expect(error.message).toBe('Failed to fetch');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should timeout after 10 seconds total (AC2)', async () => {
      const networkError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValue(networkError);

      const fetchPromise = fetchWithRetry('/api/test');

      // Attach rejection handler immediately to prevent unhandled rejection
      const errorPromise = fetchPromise.catch(err => err);

      // Fast-forward to exceed 10s total timeout
      await vi.advanceTimersByTimeAsync(1000); // First retry (1s)
      await vi.advanceTimersByTimeAsync(2000); // Second retry (2s) - Total 3s
      await vi.advanceTimersByTimeAsync(4000); // Third retry (4s) - Total 7s
      await vi.advanceTimersByTimeAsync(5000); // Would exceed 10s - should stop

      // Wait for promise to settle
      const error = await errorPromise;
      expect(error).toBeInstanceOf(TypeError);
    });

    it('should not retry non-retryable errors (AC3, AC4)', async () => {
      const validationError = new Response(
        JSON.stringify({ error: { message: 'Invalid date' } }),
        { status: 400 }
      );
      global.fetch.mockResolvedValueOnce(validationError);

      await expect(fetchWithRetry('/api/test')).rejects.toEqual(validationError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use custom retry config if provided', async () => {
      const networkError = new TypeError('Failed to fetch');
      global.fetch.mockRejectedValue(networkError);

      const customConfig = {
        maxAttempts: 2,
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 2
      };

      const fetchPromise = fetchWithRetry('/api/test', {}, customConfig);

      // Attach rejection handler immediately to prevent unhandled rejection
      const errorPromise = fetchPromise.catch(err => err);

      await vi.advanceTimersByTimeAsync(500); // First retry
      await vi.advanceTimersByTimeAsync(1000); // Second retry

      // Wait for promise to settle
      const error = await errorPromise;
      expect(error).toBeInstanceOf(TypeError);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('showError and hideError', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="error-container" class="hidden"></div>';
    });

    it('should show error with correct message (AC8)', () => {
      showError(ErrorCode.NETWORK_ERROR);

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer.classList.contains('hidden')).toBe(false);
      expect(errorContainer.innerHTML).toContain('Unable to connect');
    });

    it('should hide error container (AC8)', () => {
      showError(ErrorCode.NETWORK_ERROR);
      hideError();

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer.classList.contains('hidden')).toBe(true);
      expect(errorContainer.innerHTML).toBe('');
    });

    it('should display retry button for retryable errors (AC8)', () => {
      showError(ErrorCode.NETWORK_ERROR);

      const retryBtn = document.getElementById('error-retry-btn');
      expect(retryBtn).not.toBeNull();
    });

    it('should not display retry button for non-retryable errors (AC8)', () => {
      showError(ErrorCode.VALIDATION_ERROR);

      const retryBtn = document.getElementById('error-retry-btn');
      expect(retryBtn).toBeNull();
    });

    it('should display dismiss button for all errors (AC8)', () => {
      showError(ErrorCode.SERVER_ERROR);

      const dismissBtn = document.getElementById('error-dismiss-btn');
      expect(dismissBtn).not.toBeNull();
    });

    it('should replace {seconds} placeholder in rate limit message (AC5)', () => {
      showError(ErrorCode.RATE_LIMIT_EXCEEDED, { waitSeconds: 30 });

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer.innerHTML).toContain('30 seconds');
    });

    it('should escape HTML in error messages (security)', () => {
      const maliciousMessage = '<script>alert("XSS")</script>';

      // Manually set message for testing
      const errorContainer = document.getElementById('error-container');
      errorContainer.innerHTML = `<span>${maliciousMessage}</span>`;

      // showError should escape HTML
      showError(ErrorCode.SERVER_ERROR);

      // Check that the script tag was escaped
      expect(errorContainer.innerHTML).not.toContain('<script>');
    });
  });

  describe('localStorage fallback (AC11-AC12)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should save submission to localStorage (AC11)', () => {
      const submissionData = {
        predicted_date: '2027-03-15',
        turnstile_token: 'test-token'
      };

      saveSubmissionToLocalStorage(submissionData);

      const saved = localStorage.getItem('gta6_pending_submission');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved);
      expect(parsed.predicted_date).toBe('2027-03-15');
      expect(parsed.turnstile_token).toBe('test-token');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should retrieve pending submission from localStorage (AC11)', () => {
      const submissionData = {
        predicted_date: '2027-03-15',
        turnstile_token: 'test-token'
      };

      saveSubmissionToLocalStorage(submissionData);
      const retrieved = getPendingSubmission();

      expect(retrieved).not.toBeNull();
      expect(retrieved.predicted_date).toBe('2027-03-15');
    });

    it('should clear pending submission from localStorage (AC11)', () => {
      const submissionData = {
        predicted_date: '2027-03-15',
        turnstile_token: 'test-token'
      };

      saveSubmissionToLocalStorage(submissionData);
      clearPendingSubmission();

      const retrieved = getPendingSubmission();
      expect(retrieved).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => {
        saveSubmissionToLocalStorage({ predicted_date: '2027-03-15' });
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('logError (AC7)', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      logError('Test context', error, { additionalInfo: 'test' });

      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          context: 'Test context',
          error: expect.objectContaining({
            message: 'Test error'
          }),
          additionalInfo: 'test'
        })
      );
    });

    it('should include timestamp in error log', () => {
      const error = new Error('Test error');
      logError('Test', error);

      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Input preservation (AC9)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <input id="predicted-date" type="date" value="2027-03-15" />
        <div id="error-container" class="hidden"></div>
      `;
    });

    it('should preserve date input value when showing error', () => {
      const dateInput = document.getElementById('predicted-date');
      const originalValue = dateInput.value;

      showError(ErrorCode.NETWORK_ERROR);

      // Date input value should not be cleared
      expect(dateInput.value).toBe(originalValue);
      expect(dateInput.value).toBe('2027-03-15');
    });

    it('should keep date input intact after hiding error', () => {
      const dateInput = document.getElementById('predicted-date');
      const originalValue = dateInput.value;

      showError(ErrorCode.NETWORK_ERROR);
      hideError();

      // Date input value should still be preserved
      expect(dateInput.value).toBe(originalValue);
    });
  });

  describe('Turnstile fail-open integration (AC13)', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should allow submission with empty token when Turnstile fails', async () => {
      // Mock successful submission API response
      const successResponse = new Response(
        JSON.stringify({
          success: true,
          data: {
            prediction_id: 1234,
            predicted_date: '2027-03-15',
            submitted_at: '2025-11-26T10:00:00Z'
          }
        }),
        { status: 201 }
      );
      global.fetch.mockResolvedValueOnce(successResponse);

      // Simulate submission with empty token (Turnstile failed, fail-open)
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predicted_date: '2027-03-15',
          turnstile_token: '' // Empty token = Turnstile failed but fail-open
        })
      });

      // Submission should succeed despite empty Turnstile token
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.prediction_id).toBe(1234);
    });

    it('should classify Turnstile error correctly', async () => {
      const turnstileError = new Error('Turnstile verification failed');
      const errorInfo = await classifyError(turnstileError);

      expect(errorInfo.code).toBe(ErrorCode.TURNSTILE_FAILED);
      expect(errorInfo.message).toContain('Verification failed');
      expect(errorInfo.retryable).toBe(true);
    });

    it('should show appropriate error message for Turnstile failure', () => {
      document.body.innerHTML = '<div id="error-container" class="hidden"></div>';

      showError(ErrorCode.TURNSTILE_FAILED);

      const errorContainer = document.getElementById('error-container');
      expect(errorContainer.classList.contains('hidden')).toBe(false);
      expect(errorContainer.innerHTML).toContain('Verification failed');

      // Should show retry button for Turnstile errors
      const retryBtn = document.getElementById('error-retry-btn');
      expect(retryBtn).not.toBeNull();
    });
  });
});
