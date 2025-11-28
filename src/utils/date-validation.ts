/**
 * Date Validation Utility Module
 *
 * Provides functions for validating predicted launch dates, including format
 * validation, range validation, and leap year handling.
 *
 * Requirements: Implements FR2 (date range validation), FR73 (UTC conversion),
 * and supports Epic 2 Story 2.3 acceptance criteria.
 *
 * Date Range: 2026-11-19 to 2125-12-31 (starting from official GTA 6 launch date per PRD FR2)
 * Format: ISO 8601 (YYYY-MM-DD) throughout
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Extend day.js with UTC plugin
dayjs.extend(utc);

/**
 * Minimum allowed date for predictions (November 19, 2026 - Official GTA 6 launch date)
 * Dates before official launch are illogical for predictions
 */
export const MIN_DATE = '2026-11-19';

/**
 * Maximum allowed date for predictions (December 31, 2125)
 * 100-year range per FR2 requirement
 */
export const MAX_DATE = '2125-12-31';

/**
 * ISO 8601 date format regex (YYYY-MM-DD)
 * Validates basic structure: year (any 4-digit), month (01-12), day (01-31)
 * Note: Range validation happens separately in validateDateRange()
 */
export const DATE_REGEX = /^(\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/**
 * Validate if a given string matches ISO 8601 date format (YYYY-MM-DD)
 *
 * Validation criteria:
 * - Format: YYYY-MM-DD with leading zeros
 * - Year: 2025 to 2125 (enforced by regex)
 * - Month: 01 to 12
 * - Day: 01 to 31 (calendar validation happens in isValidCalendarDate)
 *
 * @param {string} date - The date string to validate
 * @returns {boolean} True if format is valid, false otherwise
 *
 * @example
 * isValidDateFormat('2026-11-19') // true
 * isValidDateFormat('11/19/2026') // false (wrong format)
 * isValidDateFormat('2026-13-01') // false (invalid month)
 * isValidDateFormat('invalid')    // false
 */
export function isValidDateFormat(date: string): boolean {
  if (!date || typeof date !== 'string') {
    return false;
  }
  return DATE_REGEX.test(date);
}

/**
 * Check if a date string represents a valid calendar date
 * Handles leap years correctly (Feb 29, invalid dates like Feb 30, etc.)
 *
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns {boolean} True if valid calendar date, false otherwise
 *
 * @example
 * isValidCalendarDate('2024-02-29') // true (2024 is leap year)
 * isValidCalendarDate('2025-02-29') // false (2025 not leap year)
 * isValidCalendarDate('2026-02-30') // false (Feb has max 29 days)
 * isValidCalendarDate('2026-04-31') // false (April has 30 days)
 */
export function isValidCalendarDate(dateString: string): boolean {
  const date = new Date(dateString);

  // Check if Date object is valid (not NaN)
  if (isNaN(date.getTime())) {
    return false;
  }

  // Check if Date object matches input string
  // (prevents Date coercion like "2026-02-30" -> "2026-03-02")
  const reconstructed = date.toISOString().split('T')[0];
  return reconstructed === dateString;
}

/**
 * Determine if a given year is a leap year
 *
 * Leap year rules:
 * 1. Divisible by 4 → leap year
 * 2. UNLESS divisible by 100 → NOT leap year
 * 3. UNLESS divisible by 400 → leap year
 *
 * @param {number} year - The year to check
 * @returns {boolean} True if leap year, false otherwise
 *
 * @example
 * isLeapYear(2024) // true (divisible by 4)
 * isLeapYear(2028) // true (divisible by 4)
 * isLeapYear(2100) // false (divisible by 100, not 400)
 * isLeapYear(2000) // true (divisible by 400)
 */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  if (year % 4 === 0) return true;
  return false;
}

/**
 * Validate if a date is within the allowed range (2026-11-19 to 2125-12-31)
 *
 * Range constraints per FR2:
 * - Minimum: November 19, 2026 (official GTA 6 launch date)
 * - Maximum: December 31, 2125 (100-year window)
 *
 * @param {string} dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns {boolean} True if within range, false otherwise
 *
 * @example
 * validateDateRange('2026-11-19') // true (min boundary)
 * validateDateRange('2027-01-01') // true
 * validateDateRange('2125-12-31') // true (max boundary)
 * validateDateRange('2026-11-18') // false (before min)
 * validateDateRange('2126-01-01') // false (after max)
 */
export function validateDateRange(dateString: string): boolean {
  const date = new Date(dateString);
  const min = new Date(MIN_DATE);
  const max = new Date(MAX_DATE);

  return date >= min && date <= max;
}

/**
 * Convert a local date string to UTC format (ISO 8601: YYYY-MM-DD)
 * Per FR73 requirement: All dates stored in UTC to prevent timezone confusion
 *
 * Implementation: Uses day.js with UTC plugin for reliable conversion
 *
 * @param {string} localDate - Local date string in ISO 8601 format
 * @returns {string} UTC date string in ISO 8601 format (YYYY-MM-DD)
 *
 * @example
 * convertToUTC('2026-11-19') // '2026-11-19' (date-only, no time component)
 * convertToUTC('2027-02-14') // '2027-02-14'
 */
export function convertToUTC(localDate: string): string {
  return dayjs(localDate).utc().format('YYYY-MM-DD');
}

/**
 * Comprehensive date validation combining all checks
 * This is the main validation function called by API endpoints
 *
 * Validation sequence:
 * 1. Check format (ISO 8601: YYYY-MM-DD)
 * 2. Check calendar validity (leap years, valid days per month)
 * 3. Check range (2025-01-01 to 2125-12-31)
 *
 * @param {string} dateString - The date string to validate
 * @returns {{ valid: boolean; error?: string }} Validation result with error message
 *
 * @example
 * validateDate('2026-11-19')
 * // { valid: true }
 *
 * validateDate('11/19/2026')
 * // { valid: false, error: 'Please enter a valid date' }
 *
 * validateDate('2024-12-31')
 * // { valid: false, error: "GTA 6 can't launch in the past!" }
 *
 * validateDate('2126-01-01')
 * // { valid: false, error: 'Please select a date between Jan 1, 2025 and Dec 31, 2125' }
 */
export function validateDate(dateString: string): { valid: boolean; error?: string } {
  // Check 1: Format validation
  if (!isValidDateFormat(dateString)) {
    return { valid: false, error: 'Please enter a valid date' };
  }

  // Check 2: Calendar validity (leap years, valid days)
  if (!isValidCalendarDate(dateString)) {
    return { valid: false, error: 'Please enter a valid date' };
  }

  // Check 3: Range validation
  const date = new Date(dateString);
  const min = new Date(MIN_DATE);
  const max = new Date(MAX_DATE);

  if (date < min) {
    return { valid: false, error: "GTA 6 can't launch in the past!" };
  }

  if (date > max) {
    return {
      valid: false,
      error: 'Please select a date between Jan 1, 2025 and Dec 31, 2125',
    };
  }

  return { valid: true };
}
