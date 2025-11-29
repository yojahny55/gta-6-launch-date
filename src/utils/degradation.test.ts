/**
 * Degradation Utility Tests (Story 3.7)
 * Tests feature flag determination and degradation messages
 * Target: 100% coverage
 */

import { describe, it, expect } from 'vitest';
import { getDegradationState, getDegradationMessage, getStatsCacheTTL } from './degradation';
import type { CapacityLevel } from '../types';

describe('Degradation Utility', () => {
  const resetAt = new Date('2025-11-27T00:00:00Z');

  describe('getDegradationState', () => {
    it('should return all features enabled at normal capacity', () => {
      const state = getDegradationState('normal', 50000, resetAt);

      expect(state.level).toBe('normal');
      expect(state.requestsToday).toBe(50000);
      expect(state.limitToday).toBe(100000);
      expect(state.features).toEqual({
        statsEnabled: true,
        submissionsEnabled: true,
        chartEnabled: true,
        cacheExtended: false,
      });
    });

    it('should return all features enabled at elevated capacity (80%)', () => {
      const state = getDegradationState('elevated', 80000, resetAt);

      expect(state.level).toBe('elevated');
      expect(state.features).toEqual({
        statsEnabled: true,
        submissionsEnabled: true,
        chartEnabled: true,
        cacheExtended: false,
      });
    });

    it('should disable chart and extend cache at high capacity (90%)', () => {
      const state = getDegradationState('high', 90000, resetAt);

      expect(state.level).toBe('high');
      expect(state.features).toEqual({
        statsEnabled: true,
        submissionsEnabled: true,
        chartEnabled: false, // Disabled at 90%
        cacheExtended: true, // Extended at 90%
      });
    });

    it('should disable chart and extend cache at critical capacity (95%)', () => {
      const state = getDegradationState('critical', 95000, resetAt);

      expect(state.level).toBe('critical');
      expect(state.features).toEqual({
        statsEnabled: true,
        submissionsEnabled: true,
        chartEnabled: false,
        cacheExtended: true,
      });
    });

    it('should disable submissions at exceeded capacity (100%)', () => {
      const state = getDegradationState('exceeded', 100000, resetAt);

      expect(state.level).toBe('exceeded');
      expect(state.features).toEqual({
        statsEnabled: true, // Stats remain visible
        submissionsEnabled: false, // Submissions disabled
        chartEnabled: false,
        cacheExtended: true,
      });
    });

    it('should include resetAt timestamp in ISO format', () => {
      const state = getDegradationState('normal', 0, resetAt);

      expect(state.resetAt).toBe('2025-11-27T00:00:00.000Z');
    });
  });

  describe('getDegradationMessage', () => {
    it('should return null for normal capacity', () => {
      const message = getDegradationMessage('normal');

      expect(message).toBeNull();
    });

    it('should return null for elevated capacity', () => {
      const message = getDegradationMessage('elevated');

      expect(message).toBeNull();
    });

    it('should return high traffic message at high capacity (90%)', () => {
      const message = getDegradationMessage('high');

      expect(message).toBe('High traffic! Some features temporarily limited.');
    });

    it('should return queued message at critical capacity (95%)', () => {
      const message = getDegradationMessage('critical');

      expect(message).toBe(
        "We're experiencing high traffic. Your submission will be processed shortly."
      );
    });

    it('should return capacity reached message at exceeded capacity (100%)', () => {
      const message = getDegradationMessage('exceeded');

      expect(message).toBe("We've reached capacity for today. Try again in {hours} hours.");
    });
  });

  describe('getStatsCacheTTL', () => {
    it('should return normal TTL (5 minutes) for normal capacity', () => {
      const ttl = getStatsCacheTTL('normal');

      expect(ttl).toBe(5 * 60); // 300 seconds
    });

    it('should return normal TTL for elevated capacity', () => {
      const ttl = getStatsCacheTTL('elevated');

      expect(ttl).toBe(5 * 60);
    });

    it('should return extended TTL (15 minutes) for high capacity', () => {
      const ttl = getStatsCacheTTL('high');

      expect(ttl).toBe(15 * 60); // 900 seconds
    });

    it('should return extended TTL for critical capacity', () => {
      const ttl = getStatsCacheTTL('critical');

      expect(ttl).toBe(15 * 60);
    });

    it('should return extended TTL for exceeded capacity', () => {
      const ttl = getStatsCacheTTL('exceeded');

      expect(ttl).toBe(15 * 60);
    });
  });

  describe('Feature flag consistency', () => {
    it('should progressively disable features as capacity increases', () => {
      const levels: CapacityLevel[] = ['normal', 'elevated', 'high', 'critical', 'exceeded'];
      const states = levels.map((level) => getDegradationState(level, 0, resetAt));

      // Normal: All enabled
      expect(states[0].features.chartEnabled).toBe(true);
      expect(states[0].features.submissionsEnabled).toBe(true);

      // Elevated: All enabled (no changes)
      expect(states[1].features.chartEnabled).toBe(true);
      expect(states[1].features.submissionsEnabled).toBe(true);

      // High: Chart disabled
      expect(states[2].features.chartEnabled).toBe(false);
      expect(states[2].features.submissionsEnabled).toBe(true);

      // Critical: Chart disabled, submissions queued (not disabled yet)
      expect(states[3].features.chartEnabled).toBe(false);
      expect(states[3].features.submissionsEnabled).toBe(true);

      // Exceeded: Chart disabled, submissions disabled
      expect(states[4].features.chartEnabled).toBe(false);
      expect(states[4].features.submissionsEnabled).toBe(false);
    });

    it('should extend cache at 90% and above', () => {
      const normal = getDegradationState('normal', 0, resetAt);
      const elevated = getDegradationState('elevated', 0, resetAt);
      const high = getDegradationState('high', 0, resetAt);
      const critical = getDegradationState('critical', 0, resetAt);
      const exceeded = getDegradationState('exceeded', 0, resetAt);

      expect(normal.features.cacheExtended).toBe(false);
      expect(elevated.features.cacheExtended).toBe(false);
      expect(high.features.cacheExtended).toBe(true);
      expect(critical.features.cacheExtended).toBe(true);
      expect(exceeded.features.cacheExtended).toBe(true);
    });

    it('should always keep stats enabled', () => {
      const levels: CapacityLevel[] = ['normal', 'elevated', 'high', 'critical', 'exceeded'];
      const states = levels.map((level) => getDegradationState(level, 0, resetAt));

      states.forEach((state) => {
        expect(state.features.statsEnabled).toBe(true);
      });
    });
  });
});
