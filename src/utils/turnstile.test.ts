/**
 * Cloudflare Turnstile Verification Module - Test Suite (Story 2.5B)
 *
 * Test Coverage Target: 90%+ (ADR-011 requirement)
 * Test Count Target: 25 tests (matching reCAPTCHA implementation for consistency)
 *
 * Test Categories:
 * - Unit Tests: verifyTurnstileToken(), isChallengeSuccessful()
 * - Integration Tests: Full verification workflow
 * - Edge Cases: Network errors, timeouts, malformed responses
 * - Fail-Open Behavior: API unreachable scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  verifyTurnstileToken,
  isChallengeSuccessful,
  verifyAndEvaluateTurnstile
} from './turnstile';
import type { TurnstileVerificationResult } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('Turnstile Verification Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Reset console spy
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyTurnstileToken() - Successful Verification', () => {
    it('should verify token successfully with valid response (AC2)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z',
        hostname: 'localhost'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('valid-token', 'secret-key');

      expect(result.success).toBe(true);
      expect(result.challenge_ts).toBe('2025-11-21T14:30:00Z');
      expect(result.hostname).toBe('localhost');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: 'secret-key',
            response: 'valid-token'
          })
        })
      );
      expect(console.log).toHaveBeenCalledWith(
        'Turnstile verification successful',
        expect.any(Object)
      );
    });

    it('should verify token with all optional fields present', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z',
        hostname: 'gta6-tracker.pages.dev',
        'error-codes': []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('token-123', 'secret-456');

      expect(result.success).toBe(true);
      expect(result.challenge_ts).toBeDefined();
      expect(result.hostname).toBe('gta6-tracker.pages.dev');
      expect(result['error-codes']).toEqual([]);
    });
  });

  describe('verifyTurnstileToken() - Failed Verification', () => {
    it('should return failure when challenge fails (success: false) (AC3)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['invalid-input-response']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('invalid-token', 'secret-key');

      expect(result.success).toBe(false);
      expect(result['error-codes']).toContain('invalid-input-response');
      expect(console.warn).toHaveBeenCalledWith(
        'Turnstile challenge failed',
        expect.objectContaining({
          'error-codes': ['invalid-input-response']
        })
      );
    });

    it('should handle multiple error codes from Cloudflare API', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['timeout-or-duplicate', 'invalid-input-response']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('bad-token', 'secret-key');

      expect(result.success).toBe(false);
      expect(result['error-codes']).toHaveLength(2);
      expect(result['error-codes']).toContain('timeout-or-duplicate');
      expect(result['error-codes']).toContain('invalid-input-response');
    });
  });

  describe('verifyTurnstileToken() - Input Validation', () => {
    it('should fail open when token is empty (AC6: graceful degradation)', async () => {
      const result = await verifyTurnstileToken('', 'secret-key');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('missing-input-response');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Turnstile token is missing')
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fail open when token is not a string', async () => {
      const result = await verifyTurnstileToken(null as any, 'secret-key');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('missing-input-response');
    });

    it('should fail open when secret key is empty (AC6)', async () => {
      const result = await verifyTurnstileToken('valid-token', '');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('missing-input-secret');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Turnstile secret key is missing')
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fail open when secret key is not a string', async () => {
      const result = await verifyTurnstileToken('valid-token', undefined as any);

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('missing-input-secret');
    });
  });

  describe('verifyTurnstileToken() - Network Error Handling (AC6: Fail Open)', () => {
    it('should fail open when API returns HTTP 500 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('http-500');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 500')
      );
    });

    it('should fail open when API returns HTTP 503 Service Unavailable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('http-503');
    });

    it('should fail open when network request times out (3s) (AC6)', async () => {
      // Simulate timeout by delaying response beyond 3 seconds
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 50);
          })
      );

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('network-error');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('timed out after 3s'),
        expect.objectContaining({ fail_open: true })
      );
    });

    it('should fail open when API is unreachable (DNS failure)', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('network-error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('network error'),
        expect.objectContaining({ fail_open: true })
      );
    });

    it('should fail open when JSON parsing fails (malformed response)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      });

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('network-error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('network error'),
        expect.objectContaining({
          fail_open: true
        })
      );
    });

    it('should fail open on unknown error types', async () => {
      (global.fetch as any).mockRejectedValueOnce('weird error string');

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true); // Fail open
      expect(result['error-codes']).toContain('network-error');
    });
  });

  describe('isChallengeSuccessful() - Evaluation Logic (AC3)', () => {
    it('should return true when success is true', () => {
      const result: TurnstileVerificationResult = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z'
      };

      expect(isChallengeSuccessful(result)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        'Turnstile challenge evaluation: PASSED'
      );
    });

    it('should return false when success is false (AC3)', () => {
      const result: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['invalid-input-response']
      };

      expect(isChallengeSuccessful(result)).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'Turnstile challenge evaluation: FAILED',
        expect.objectContaining({
          'error-codes': ['invalid-input-response']
        })
      );
    });

    it('should handle result with no error codes', () => {
      const result: TurnstileVerificationResult = {
        success: false
      };

      expect(isChallengeSuccessful(result)).toBe(false);
    });

    it('should return true for fail-open scenarios (network errors)', () => {
      const result: TurnstileVerificationResult = {
        success: true, // Fail open sets success: true
        'error-codes': ['network-error']
      };

      expect(isChallengeSuccessful(result)).toBe(true);
    });
  });

  describe('verifyAndEvaluateTurnstile() - Convenience Wrapper', () => {
    it('should combine verification and evaluation for passed challenge', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { passed, result } = await verifyAndEvaluateTurnstile('token', 'secret');

      expect(passed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.challenge_ts).toBe('2025-11-21T14:30:00Z');
    });

    it('should combine verification and evaluation for failed challenge', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['invalid-input-response']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { passed, result } = await verifyAndEvaluateTurnstile('token', 'secret');

      expect(passed).toBe(false);
      expect(result.success).toBe(false);
      expect(result['error-codes']).toContain('invalid-input-response');
    });

    it('should handle network errors with fail-open', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { passed, result } = await verifyAndEvaluateTurnstile('token', 'secret');

      expect(passed).toBe(true); // Fail open
      expect(result.success).toBe(true);
      expect(result['error-codes']).toContain('network-error');
    });
  });

  describe('Edge Cases and Real-World Scenarios', () => {
    it('should handle expired token (timeout-or-duplicate error)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['timeout-or-duplicate']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('expired-token', 'secret');

      expect(result.success).toBe(false);
      expect(result['error-codes']).toContain('timeout-or-duplicate');
    });

    it('should handle token already used (replay attack)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['timeout-or-duplicate']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('used-token', 'secret');

      expect(result.success).toBe(false);
      expect(result['error-codes']).toContain('timeout-or-duplicate');
    });

    it('should handle invalid secret key from Cloudflare', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['invalid-input-secret']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('token', 'wrong-secret');

      expect(result.success).toBe(false);
      expect(result['error-codes']).toContain('invalid-input-secret');
    });

    it('should handle very long token string (edge case)', async () => {
      const longToken = 'a'.repeat(10000);
      const mockResponse: TurnstileVerificationResult = {
        success: true
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken(longToken, 'secret');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle API response with unexpected fields gracefully', async () => {
      const mockResponse = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z',
        hostname: 'localhost',
        unexpected_field: 'should be ignored',
        another_field: 123
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await verifyTurnstileToken('token', 'secret');

      expect(result.success).toBe(true);
      expect(result.challenge_ts).toBe('2025-11-21T14:30:00Z');
    });
  });

  describe('Monitoring and Logging', () => {
    it('should log successful verification with context (Task 9)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: true,
        challenge_ts: '2025-11-21T14:30:00Z',
        hostname: 'localhost'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await verifyTurnstileToken('token', 'secret');

      expect(console.log).toHaveBeenCalledWith(
        'Turnstile verification successful',
        {
          challenge_ts: '2025-11-21T14:30:00Z',
          hostname: 'localhost'
        }
      );
    });

    it('should log failed verification with error codes (Task 9)', async () => {
      const mockResponse: TurnstileVerificationResult = {
        success: false,
        'error-codes': ['invalid-input-response', 'bad-request']
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await verifyTurnstileToken('token', 'secret');

      expect(console.warn).toHaveBeenCalledWith(
        'Turnstile challenge failed',
        {
          'error-codes': ['invalid-input-response', 'bad-request']
        }
      );
    });

    it('should log fail-open events with context (Task 9)', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      await verifyTurnstileToken('token', 'secret');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('network error'),
        expect.objectContaining({
          fail_open: true,
          error: 'Connection refused'
        })
      );
    });
  });
});
