/**
 * Stats Display Integration Tests
 *
 * Tests the complete stats display workflow including:
 * - DOM manipulation for stats display
 * - Loading state management
 * - Error state with retry
 * - Threshold logic (< 50 predictions)
 * - Stats formatting functions
 *
 * Story: 3.1 Landing Page with Stats Display
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load the actual HTML and JavaScript files
const htmlContent = fs.readFileSync(
  path.join(process.cwd(), 'public/index.html'),
  'utf-8'
);
const appJsContent = fs.readFileSync(
  path.join(process.cwd(), 'public/app.js'),
  'utf-8'
);

// Mock stats responses
const mockStatsAboveThreshold = {
  median: '2027-02-14',
  min: '2025-06-15',
  max: '2099-12-31',
  count: 10234,
  cached_at: '2025-11-24T14:30:00Z',
};

const mockStatsBelowThreshold = {
  median: null,
  min: '2025-06-15',
  max: '2027-03-15',
  count: 12,
  cached_at: '2025-11-24T14:30:00Z',
};

const mockStatsAtThreshold = {
  median: '2027-02-14',
  min: '2025-06-15',
  max: '2099-12-31',
  count: 50,
  cached_at: '2025-11-24T14:30:00Z',
};

describe('Stats Display Integration', () => {
  let document: Document;
  let window: Window & typeof globalThis;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Use happy-dom environment for lightweight DOM testing
    const { Window } = await import('happy-dom');
    const happyWindow = new Window();

    document = happyWindow.document;
    window = happyWindow as unknown as Window & typeof globalThis;

    // Mock crypto.randomUUID for cookie generation
    window.crypto = {
      randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
      // @ts-expect-error - Partial crypto mock
      subtle: {},
    } as Crypto;

    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch globally
    fetchMock = vi.fn();
    window.fetch = fetchMock;

    // Clear localStorage to prevent fallback cache from succeeding
    window.localStorage.clear();

    // Set the HTML content
    document.documentElement.innerHTML = htmlContent;

    // Execute app.js code in the window context without triggering DOMContentLoaded
    const executeInWindowScope = new Function('window', 'document', 'fetch', appJsContent);
    executeInWindowScope(window, document, fetchMock);
  });

  describe('Stats Formatting Functions', () => {
    test('formatDateForDisplay formats ISO date to locale string', () => {
      // Access formatDateForDisplay through window scope
      const executeTest = new Function(
        'window',
        'document',
        appJsContent + `
        return formatDateForDisplay('2027-02-14');
      `
      );
      const result = executeTest(window, document);

      // Should contain the year and be a non-empty string
      expect(result).toContain('2027');
      expect(result.length).toBeGreaterThan(0);
    });

    test('formatDateForDisplay returns "--" for null/undefined', () => {
      const executeTest = new Function(
        'window',
        'document',
        appJsContent + `
        return formatDateForDisplay(null);
      `
      );
      const result = executeTest(window, document);
      expect(result).toBe('--');
    });

    test('formatNumber formats large numbers with commas', () => {
      const executeTest = new Function(
        'window',
        'document',
        appJsContent + `
        return formatNumber(10234);
      `
      );
      const result = executeTest(window, document);

      // Should be formatted with comma (locale-dependent)
      expect(result).toMatch(/10[,.]?234/);
    });

    test('formatNumber returns "--" for invalid input', () => {
      const executeTest = new Function(
        'window',
        'document',
        appJsContent + `
        return formatNumber('not a number');
      `
      );
      const result = executeTest(window, document);
      expect(result).toBe('--');
    });

    test('formatStats returns formatted stats object', () => {
      const executeTest = new Function(
        'window',
        'document',
        appJsContent + `
        return formatStats({
          median: '2027-02-14',
          min: '2025-06-15',
          max: '2099-12-31',
          count: 10234
        });
      `
      );
      const result = executeTest(window, document);

      expect(result.median).toContain('2027');
      expect(result.min).toContain('2025');
      expect(result.max).toContain('2099');
      expect(result.count).toMatch(/10[,.]?234/);
      expect(result.rawCount).toBe(10234);
    });
  });

  describe('Stats Display States', () => {
    test('should show loading state initially', () => {
      // Before DOMContentLoaded, loading state should be visible
      const loadingDiv = document.getElementById('stats-loading');
      const contentDiv = document.getElementById('stats-content');
      const errorDiv = document.getElementById('stats-error');
      const thresholdDiv = document.getElementById('stats-threshold');

      // Loading should be visible by default (not hidden)
      expect(loadingDiv?.classList.contains('hidden')).toBe(false);
      // Others should be hidden
      expect(contentDiv?.classList.contains('hidden')).toBe(true);
      expect(errorDiv?.classList.contains('hidden')).toBe(true);
      expect(thresholdDiv?.classList.contains('hidden')).toBe(true);
    });

    test('should show content state when stats are loaded', async () => {
      // Mock successful fetch response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsAboveThreshold,
        headers: {
          get: (name: string) => (name === 'X-Cache' ? 'HIT' : null),
        },
      });

      // Trigger DOMContentLoaded to initialize stats
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      const loadingDiv = document.getElementById('stats-loading');
      const contentDiv = document.getElementById('stats-content');
      const errorDiv = document.getElementById('stats-error');

      // Loading should be hidden
      expect(loadingDiv?.classList.contains('hidden')).toBe(true);
      // Content should be visible
      expect(contentDiv?.classList.contains('hidden')).toBe(false);
      // Error should be hidden
      expect(errorDiv?.classList.contains('hidden')).toBe(true);
    });

    test('should show threshold state when count < 50', async () => {
      // Mock response with count below threshold
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsBelowThreshold,
        headers: {
          get: (name: string) => (name === 'X-Cache' ? 'HIT' : null),
        },
      });

      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      const loadingDiv = document.getElementById('stats-loading');
      const contentDiv = document.getElementById('stats-content');
      const thresholdDiv = document.getElementById('stats-threshold');
      const thresholdCount = document.getElementById('stats-threshold-count');

      // Loading should be hidden
      expect(loadingDiv?.classList.contains('hidden')).toBe(true);
      // Content should be hidden
      expect(contentDiv?.classList.contains('hidden')).toBe(true);
      // Threshold should be visible
      expect(thresholdDiv?.classList.contains('hidden')).toBe(false);
      // Count should show current value
      expect(thresholdCount?.textContent).toBe('12');
    });

    test('should show error state on fetch failure', async () => {
      // Mock failed fetch response
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Trigger DOMContentLoaded
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for async operations (including retries)
      await new Promise((resolve) => setTimeout(resolve, 15000));

      const loadingDiv = document.getElementById('stats-loading');
      const contentDiv = document.getElementById('stats-content');
      const errorDiv = document.getElementById('stats-error');

      // Loading should be hidden
      expect(loadingDiv?.classList.contains('hidden')).toBe(true);
      // Content should be hidden
      expect(contentDiv?.classList.contains('hidden')).toBe(true);
      // Error should be visible
      expect(errorDiv?.classList.contains('hidden')).toBe(false);
    }, 20000); // Extended timeout for retry logic
  });

  describe('Stats Content Rendering', () => {
    test('should display median date correctly', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsAboveThreshold,
        headers: {
          get: () => null,
        },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const medianElement = document.getElementById('stats-median');
      expect(medianElement?.textContent).toContain('2027');
    });

    test('should display count with proper formatting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsAboveThreshold,
        headers: {
          get: () => null,
        },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const countElement = document.getElementById('stats-count-value');
      // Should be formatted with thousand separator (10,234 or 10.234 depending on locale)
      expect(countElement?.textContent).toMatch(/10[,.]?234/);
    });

    test('should display min and max dates', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsAboveThreshold,
        headers: {
          get: () => null,
        },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const minElement = document.getElementById('stats-min');
      const maxElement = document.getElementById('stats-max');

      expect(minElement?.textContent).toContain('2025');
      expect(maxElement?.textContent).toContain('2099');
    });
  });

  describe('Threshold Logic (FR99)', () => {
    test('should show threshold message when count is 0', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStatsBelowThreshold, count: 0 }),
        headers: { get: () => null },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const thresholdDiv = document.getElementById('stats-threshold');
      expect(thresholdDiv?.classList.contains('hidden')).toBe(false);
    });

    test('should show threshold message when count is 49', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockStatsBelowThreshold, count: 49 }),
        headers: { get: () => null },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const thresholdDiv = document.getElementById('stats-threshold');
      const thresholdCount = document.getElementById('stats-threshold-count');

      expect(thresholdDiv?.classList.contains('hidden')).toBe(false);
      expect(thresholdCount?.textContent).toBe('49');
    });

    test('should show content when count is exactly 50', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsAtThreshold,
        headers: { get: () => null },
      });

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const contentDiv = document.getElementById('stats-content');
      const thresholdDiv = document.getElementById('stats-threshold');

      expect(contentDiv?.classList.contains('hidden')).toBe(false);
      expect(thresholdDiv?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Error Handling and Retry', () => {
    test('retry button should be present in error state', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 15000));

      const retryBtn = document.getElementById('stats-retry-btn');
      expect(retryBtn).toBeTruthy();
      expect(retryBtn?.getAttribute('aria-label')).toBe('Retry loading statistics');
    }, 20000);

    test('error message should be displayed in error state', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 15000));

      const errorMessage = document.getElementById('stats-error-message');
      expect(errorMessage?.textContent).toContain('Unable to load statistics');
    }, 20000);
  });

  describe('Landing Page Structure (AC1)', () => {
    test('should have H1 headline with correct text', () => {
      const h1 = document.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toContain('When Will GTA 6 Actually Launch?');
    });

    test('should have subhead with Rockstar date', () => {
      const subhead = document.querySelector('header p');
      expect(subhead).toBeTruthy();
      expect(subhead?.textContent).toContain('Rockstar says');
      expect(subhead?.textContent).toContain('November 19, 2026');
    });

    test('should have stats display section above form', () => {
      const statsSection = document.getElementById('stats-display');
      const form = document.getElementById('prediction-form');

      expect(statsSection).toBeTruthy();
      expect(form).toBeTruthy();

      // Stats should come before form in DOM order
      const allElements = Array.from(document.querySelectorAll('#stats-display, #prediction-form'));
      expect(allElements[0]?.id).toBe('stats-display');
    });

    test('should have "Add My Prediction" button text', () => {
      const submitButton = document.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Add My Prediction');
    });
  });

  describe('Visual Hierarchy (AC4)', () => {
    test('median should have largest text styling', () => {
      const medianElement = document.getElementById('stats-median');
      expect(medianElement?.classList.contains('text-4xl')).toBe(true);
      // Should also have responsive sizing classes
      expect(medianElement?.className).toContain('md:text-5xl');
      expect(medianElement?.className).toContain('lg:text-6xl');
    });

    test('count should have secondary styling', () => {
      const countText = document.getElementById('stats-count');
      expect(countText?.classList.contains('text-lg')).toBe(true);
    });

    test('min/max range should have tertiary styling', () => {
      const rangeText = document.getElementById('stats-range');
      expect(rangeText?.classList.contains('text-sm')).toBe(true);
    });
  });

  describe('Accessibility (FR71)', () => {
    test('stats section should have aria-labelledby', () => {
      const statsSection = document.getElementById('stats-display');
      expect(statsSection?.getAttribute('aria-labelledby')).toBe('stats-heading');
    });

    test('stats section should have aria-live for dynamic updates', () => {
      const statsSection = document.getElementById('stats-display');
      expect(statsSection?.getAttribute('aria-live')).toBe('polite');
    });

    test('should have screen reader only heading', () => {
      const heading = document.getElementById('stats-heading');
      expect(heading).toBeTruthy();
      expect(heading?.classList.contains('sr-only')).toBe(true);
      expect(heading?.textContent).toContain('Community Prediction Statistics');
    });

    test('median should have aria-label', () => {
      const medianElement = document.getElementById('stats-median');
      expect(medianElement?.getAttribute('aria-label')).toBe('Community median prediction date');
    });

    test('retry button should have aria-label', () => {
      const retryBtn = document.getElementById('stats-retry-btn');
      expect(retryBtn?.getAttribute('aria-label')).toBe('Retry loading statistics');
    });
  });
});
