/**
 * Status Calculator Utility
 *
 * Calculates community sentiment status based on the weighted median prediction
 * compared to the official GTA 6 release date.
 *
 * Status Thresholds:
 * - Early Release Possible: median < official - 60 days
 * - On Track: median within ±60 days of official
 * - Delay Likely: median between +60 and +180 days of official
 * - Major Delay Expected: median > official + 180 days
 */

export type StatusValue =
  | 'Early Release Possible'
  | 'On Track'
  | 'Delay Likely'
  | 'Major Delay Expected';

export type StatusColor = 'green' | 'blue' | 'amber' | 'red';

export interface StatusResult {
  status: StatusValue;
  color: StatusColor;
  daysDifference: number;
}

/**
 * Official GTA 6 release date announced by Rockstar Games
 */
export const OFFICIAL_RELEASE_DATE = '2026-11-19';

/**
 * Threshold values for status determination (in days)
 */
export const STATUS_THRESHOLDS = {
  EARLY_RELEASE: -60,      // More than 60 days before official
  ON_TRACK_MIN: -60,       // 60 days before official
  ON_TRACK_MAX: 60,        // 60 days after official
  DELAY_LIKELY_MAX: 180,   // 180 days after official
} as const;

/**
 * Calculates the community sentiment status based on the median prediction date
 *
 * @param medianDate - The weighted median prediction date (ISO 8601 format: YYYY-MM-DD)
 * @param officialDate - The official release date (defaults to OFFICIAL_RELEASE_DATE)
 * @returns StatusResult containing status, color, and days difference
 *
 * @example
 * ```typescript
 * const result = calculateStatus('2027-03-15');
 * // Returns: { status: 'Delay Likely', color: 'amber', daysDifference: 116 }
 * ```
 */
export function calculateStatus(
  medianDate: string,
  officialDate: string = OFFICIAL_RELEASE_DATE
): StatusResult {
  const official = new Date(officialDate);
  const median = new Date(medianDate);

  // Calculate difference in days
  const daysDiff = Math.round(
    (median.getTime() - official.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Determine status based on thresholds
  if (daysDiff < STATUS_THRESHOLDS.EARLY_RELEASE) {
    return {
      status: 'Early Release Possible',
      color: 'green',
      daysDifference: daysDiff
    };
  } else if (daysDiff >= STATUS_THRESHOLDS.ON_TRACK_MIN && daysDiff <= STATUS_THRESHOLDS.ON_TRACK_MAX) {
    return {
      status: 'On Track',
      color: 'blue',
      daysDifference: daysDiff
    };
  } else if (daysDiff > STATUS_THRESHOLDS.ON_TRACK_MAX && daysDiff <= STATUS_THRESHOLDS.DELAY_LIKELY_MAX) {
    return {
      status: 'Delay Likely',
      color: 'amber',
      daysDifference: daysDiff
    };
  } else {
    return {
      status: 'Major Delay Expected',
      color: 'red',
      daysDifference: daysDiff
    };
  }
}

/**
 * Validates if a date string is in valid ISO 8601 format
 *
 * @param dateString - The date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  // Check for ISO 8601 format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
