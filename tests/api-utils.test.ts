/**
 * Tests for API utility module
 * Validates environment-aware API URL resolution and helper functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAPI, getEnvironmentInfo } from '../src/utils/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.log to avoid noise in test output
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('API Utility Module', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment information', () => {
      const info = getEnvironmentInfo();

      expect(info).toHaveProperty('apiUrl');
      expect(info).toHaveProperty('environment');
      expect(typeof info.apiUrl).toBe('string');
      expect(typeof info.environment).toBe('string');
    });

    it('should return localhost URL when VITE_API_URL is not set', () => {
      const info = getEnvironmentInfo();

      // In test environment, VITE_API_URL is not set, so should fallback to localhost
      expect(info.apiUrl).toBe('http://localhost:8787');
    });

    it('should return local environment when VITE_ENVIRONMENT is not set', () => {
      const info = getEnvironmentInfo();

      // In test environment, VITE_ENVIRONMENT is not set, so should fallback to local
      expect(info.environment).toBe('local');
    });
  });

  describe('callAPI', () => {
    it('should make a fetch request to the correct URL', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await callAPI('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('should include Content-Type header by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('/api/test');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Content-Type');
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });

    it('should merge custom headers with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Content-Type');
      expect(callArgs.headers).toHaveProperty('X-Custom-Header');
      expect(callArgs.headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should pass through fetch options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: true }),
      });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.method).toBe('POST');
      expect(callArgs.body).toBe(JSON.stringify({ test: true }));
    });

    it('should return JSON response on success', async () => {
      const mockData = { success: true, data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await callAPI('/api/test');

      expect(result).toEqual(mockData);
    });

    it('should throw error on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(callAPI('/api/test')).rejects.toThrow(
        'API error: 404 Not Found',
      );
    });

    it('should throw error on 500 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(callAPI('/api/test')).rejects.toThrow(
        'API error: 500 Internal Server Error',
      );
    });

    it('should not log API calls in production', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('/api/test');

      // Console logging has been removed to reduce noise in production
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(callAPI('/api/test')).rejects.toThrow('Network error');
    });

    it('should construct correct endpoint paths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('/api/predict');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/predict',
        expect.any(Object),
      );
    });

    it('should handle endpoints without leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await callAPI('api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787api/test',
        expect.any(Object),
      );
    });
  });
});
