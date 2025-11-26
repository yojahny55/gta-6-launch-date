/**
 * Degradation Utility (Story 3.7)
 * Determines feature flags based on capacity level
 * Implements graceful degradation strategy per AC2-AC8
 */

import type { CapacityLevel, DegradationState } from '../types';
import { DAILY_REQUEST_LIMIT } from '../services/capacity.service';

/**
 * Get degradation state and feature flags based on capacity level
 * @param level - Current capacity level
 * @param requestsToday - Current request count
 * @param resetAt - Reset timestamp
 * @returns Degradation state with feature flags
 */
export function getDegradationState(
  level: CapacityLevel,
  requestsToday: number,
  resetAt: Date
): DegradationState {
  // Determine feature flags based on capacity level
  const features = {
    statsEnabled: true, // Always enabled unless exceeded
    submissionsEnabled: true, // Disabled at exceeded (100%)
    chartEnabled: true, // Disabled at high (90%+)
    cacheExtended: false, // Extended at high (90%+)
  };

  switch (level) {
    case 'normal':
      // All features enabled, normal operation
      break;

    case 'elevated':
      // AC1: At 80% - log warning, no user-facing changes
      break;

    case 'high':
      // AC2-AC4: At 90% - extend cache, disable chart, show notice
      features.chartEnabled = false;
      features.cacheExtended = true;
      break;

    case 'critical':
      // AC5-AC7: At 95% - cached stats only, queue submissions
      features.chartEnabled = false;
      features.cacheExtended = true;
      // Note: Queue logic is handled in routes/predict.ts
      break;

    case 'exceeded':
      // AC8-AC10: At 100% - read-only mode
      features.statsEnabled = true; // Keep stats visible
      features.submissionsEnabled = false; // Disable new submissions
      features.chartEnabled = false;
      features.cacheExtended = true;
      break;
  }

  return {
    level,
    requestsToday,
    limitToday: DAILY_REQUEST_LIMIT,
    resetAt: resetAt.toISOString(),
    features,
  };
}

/**
 * Get user-facing message for degradation level
 * @param level - Current capacity level
 * @returns User-friendly message (or null for normal/elevated)
 */
export function getDegradationMessage(level: CapacityLevel): string | null {
  switch (level) {
    case 'normal':
    case 'elevated':
      return null; // No user-facing message

    case 'high':
      // AC4: At 90%
      return 'High traffic! Some features temporarily limited.';

    case 'critical':
      // AC7: At 95%
      return "We're experiencing high traffic. Your submission will be processed shortly.";

    case 'exceeded':
      // AC9: At 100%
      return "We've reached capacity for today. Try again in {hours} hours.";
  }
}

/**
 * Get extended cache TTL for statistics during high capacity
 * @param level - Current capacity level
 * @returns Cache TTL in seconds
 */
export function getStatsCacheTTL(level: CapacityLevel): number {
  const NORMAL_TTL = 5 * 60; // 5 minutes (Story 2.10)
  const EXTENDED_TTL = 15 * 60; // 15 minutes (AC2)

  // Extend cache at high (90%+) capacity
  if (level === 'high' || level === 'critical' || level === 'exceeded') {
    return EXTENDED_TTL;
  }

  return NORMAL_TTL;
}
