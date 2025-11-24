/**
 * Weighted Median Algorithm Utility Module
 *
 * Provides functions for calculating weighted medians and date-based weights
 * to reduce the influence of troll predictions (e.g., 2099, 1999).
 *
 * Weight tiers (based on years difference from official date 2026-11-19):
 * - Within 5 years: 1.0 (full weight) - reasonable predictions
 * - 5-50 years: 0.3 (reduced weight) - less likely but possible
 * - Beyond 50 years: 0.1 (minimal weight) - troll/unreasonable predictions
 *
 * @see Story 2.9: Weighted Median Algorithm Implementation
 * @see docs/architecture.md - Implementation Patterns: Weighted Median Algorithm
 */

import dayjs from 'dayjs';

/**
 * Official GTA 6 release date (announced by Rockstar Games)
 * Used as the reference point for calculating date reasonableness
 */
export const OFFICIAL_DATE = '2026-11-19';

/**
 * Weight tier boundaries (years from official date)
 */
export const WEIGHT_TIER_FULL = 5; // 0-5 years: full weight (1.0)
export const WEIGHT_TIER_REDUCED = 50; // 5-50 years: reduced weight (0.3)

/**
 * Weight values for each tier
 */
export const WEIGHT_FULL = 1.0; // Within 5 years
export const WEIGHT_REDUCED = 0.3; // 5-50 years
export const WEIGHT_MINIMAL = 0.1; // Beyond 50 years

/**
 * Interface for weighted prediction data
 */
export interface WeightedPrediction {
  date: string; // ISO 8601 format (YYYY-MM-DD)
  weight: number; // Weight value (0.1 to 1.0)
}

/**
 * Calculate weight based on date reasonableness
 *
 * Weight formula: Predictions closer to the official date get higher weight
 * - Within 5 years (2021-2031): 1.0 (full weight)
 * - 5-50 years: 0.3 (reduced weight)
 * - Beyond 50 years: 0.1 (minimal weight)
 *
 * @param predictedDate - Date string in ISO 8601 format (YYYY-MM-DD) or Date object
 * @returns Weight value between 0.1 and 1.0
 *
 * @example
 * calculateWeight('2026-11-19') // 1.0 (official date)
 * calculateWeight('2027-03-15') // 1.0 (within 5 years)
 * calculateWeight('2040-01-01') // 0.3 (about 13 years)
 * calculateWeight('2099-12-31') // 0.1 (73 years out)
 */
export function calculateWeight(predictedDate: Date | string): number {
  const officialDate = dayjs(OFFICIAL_DATE);
  const predicted = dayjs(predictedDate);

  // Calculate absolute years difference (handles both past and future)
  const yearsDiff = Math.abs(predicted.diff(officialDate, 'year', true));

  // Apply weight tiers
  if (yearsDiff <= WEIGHT_TIER_FULL) {
    return WEIGHT_FULL; // 1.0 for predictions within 5 years
  }

  if (yearsDiff <= WEIGHT_TIER_REDUCED) {
    return WEIGHT_REDUCED; // 0.3 for predictions 5-50 years out
  }

  return WEIGHT_MINIMAL; // 0.1 for predictions beyond 50 years
}

/**
 * Calculate weighted median from an array of weighted predictions
 *
 * Algorithm:
 * 1. Sort predictions by date (ascending)
 * 2. Calculate total weight sum
 * 3. Find 50th percentile by cumulative weight
 * 4. Return the date where cumulative weight >= targetWeight (50%)
 *
 * Time complexity: O(n log n) for sorting, O(n) for finding median
 *
 * @param predictions - Array of weighted predictions with date and weight
 * @returns Weighted median date string (ISO 8601), or null if no valid predictions
 *
 * @example
 * // All reasonable dates - returns true median
 * calculateWeightedMedian([
 *   { date: '2026-01-01', weight: 1.0 },
 *   { date: '2026-11-19', weight: 1.0 },
 *   { date: '2027-06-15', weight: 1.0 },
 * ]) // '2026-11-19'
 *
 * // Mix of reasonable + outliers - outliers have less influence
 * calculateWeightedMedian([
 *   { date: '2026-11-19', weight: 1.0 },
 *   { date: '2027-01-01', weight: 1.0 },
 *   { date: '2099-12-31', weight: 0.1 },  // Troll prediction
 * ]) // '2026-11-19' (outlier has minimal influence)
 */
export function calculateWeightedMedian(predictions: WeightedPrediction[]): string | null {
  // Edge case: Empty array
  if (predictions.length === 0) {
    return null;
  }

  // Edge case: Single prediction
  if (predictions.length === 1) {
    return predictions[0].date;
  }

  // Sort by date (ascending)
  const sorted = [...predictions].sort(
    (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
  );

  // Calculate total weight
  const totalWeight = sorted.reduce((sum, p) => sum + p.weight, 0);

  // Edge case: All weights are 0 - fallback to simple median
  if (totalWeight === 0) {
    const middleIndex = Math.floor((sorted.length - 1) / 2);
    return sorted[middleIndex].date;
  }

  // Find 50th percentile by cumulative weight
  const targetWeight = totalWeight / 2;
  let cumulativeWeight = 0;

  for (const item of sorted) {
    cumulativeWeight += item.weight;
    if (cumulativeWeight >= targetWeight) {
      return item.date;
    }
  }

  // Fallback: Return last item (should not reach here with valid data)
  return sorted[sorted.length - 1].date;
}

/**
 * Calculate weighted median directly from database result rows
 *
 * Convenience function that accepts database result format directly.
 * Converts predicted_date and weight fields to WeightedPrediction format.
 *
 * @param rows - Array of database rows with predicted_date and weight fields
 * @returns Weighted median date string (ISO 8601), or null if no valid predictions
 *
 * @example
 * const rows = await db.prepare(
 *   'SELECT predicted_date, weight FROM predictions ORDER BY predicted_date ASC'
 * ).all();
 * const median = calculateWeightedMedianFromRows(rows.results);
 */
export function calculateWeightedMedianFromRows(
  rows: Array<{ predicted_date: string; weight: number }>
): string | null {
  const predictions: WeightedPrediction[] = rows.map((row) => ({
    date: row.predicted_date,
    weight: row.weight,
  }));

  return calculateWeightedMedian(predictions);
}

/**
 * Calculate simple median (unweighted) - fallback function
 *
 * Used when all weights are 0 (FR63 requirement) or as comparison baseline.
 * For even number of predictions, returns the lower of the two middle values.
 *
 * @param dates - Array of date strings in ISO 8601 format
 * @returns Median date string, or null if empty array
 *
 * @example
 * calculateSimpleMedian(['2026-01-01', '2026-06-15', '2027-01-01']) // '2026-06-15'
 * calculateSimpleMedian(['2026-01-01', '2027-01-01']) // '2026-01-01' (lower of middle two)
 */
export function calculateSimpleMedian(dates: string[]): string | null {
  if (dates.length === 0) {
    return null;
  }

  // Sort by date (ascending)
  const sorted = [...dates].sort((a, b) => dayjs(a).unix() - dayjs(b).unix());

  // For even number, return lower of two middle values
  const middleIndex = Math.floor((sorted.length - 1) / 2);
  return sorted[middleIndex];
}
