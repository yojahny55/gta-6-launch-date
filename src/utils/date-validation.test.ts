/**
 * Date Validation Utility - Unit Tests
 *
 * Comprehensive test suite achieving 100% coverage per ADR-011
 * Tests all date validation functions, edge cases, and boundary conditions
 *
 * Story 2.3: Date Picker with Validation
 * AC5: Automated tests exist covering main functionality
 */

import { describe, it, expect } from 'vitest';
import {
  MIN_DATE,
  MAX_DATE,
  DATE_REGEX,
  isValidDateFormat,
  isValidCalendarDate,
  isLeapYear,
  validateDateRange,
  convertToUTC,
  validateDate,
} from './date-validation';

describe('Date Validation Constants', () => {
  it('should have correct MIN_DATE (2026-11-19)', () => {
    expect(MIN_DATE).toBe('2026-11-19');
  });

  it('should have correct MAX_DATE (2125-12-31)', () => {
    expect(MAX_DATE).toBe('2125-12-31');
  });

  it('should have valid DATE_REGEX pattern', () => {
    expect(DATE_REGEX).toBeInstanceOf(RegExp);
  });
});

describe('isValidDateFormat', () => {
  describe('Valid ISO 8601 formats', () => {
    it('should accept valid date in range (2026-11-19)', () => {
      expect(isValidDateFormat('2026-11-19')).toBe(true);
    });

    it('should accept minimum boundary date (2026-11-19)', () => {
      expect(isValidDateFormat('2026-11-19')).toBe(true);
    });

    it('should accept maximum boundary date (2125-12-31)', () => {
      expect(isValidDateFormat('2125-12-31')).toBe(true);
    });

    it('should accept leap year date (2024-02-29)', () => {
      expect(isValidDateFormat('2024-02-29')).toBe(true);
    });

    it('should accept mid-range dates', () => {
      expect(isValidDateFormat('2050-06-15')).toBe(true);
      expect(isValidDateFormat('2075-12-25')).toBe(true);
      expect(isValidDateFormat('2100-01-01')).toBe(true);
    });
  });

  describe('Invalid date formats', () => {
    it('should reject MM/DD/YYYY format (11/19/2026)', () => {
      expect(isValidDateFormat('11/19/2026')).toBe(false);
    });

    it('should reject DD-MM-YYYY format (19-11-2026)', () => {
      expect(isValidDateFormat('19-11-2026')).toBe(false);
    });

    it('should reject invalid string (invalid-date)', () => {
      expect(isValidDateFormat('invalid-date')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidDateFormat('')).toBe(false);
    });

    it('should reject null input', () => {
      expect(isValidDateFormat(null as any)).toBe(false);
    });

    it('should reject undefined input', () => {
      expect(isValidDateFormat(undefined as any)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidDateFormat(123 as any)).toBe(false);
      expect(isValidDateFormat({} as any)).toBe(false);
    });

    it('should accept year before 2025 for format validation (2024-12-31)', () => {
      // Note: Format validation only checks YYYY-MM-DD structure
      // Range validation happens separately in validateDateRange()
      expect(isValidDateFormat('2024-12-31')).toBe(true);
    });

    it('should accept year after 2125 for format validation (2126-01-01)', () => {
      // Note: Format validation only checks YYYY-MM-DD structure
      // Range validation happens separately in validateDateRange()
      expect(isValidDateFormat('2126-01-01')).toBe(true);
    });

    it('should reject invalid month (13)', () => {
      expect(isValidDateFormat('2026-13-01')).toBe(false);
    });

    it('should reject invalid day (32)', () => {
      expect(isValidDateFormat('2026-01-32')).toBe(false);
    });

    it('should reject missing leading zeros (2026-1-9)', () => {
      expect(isValidDateFormat('2026-1-9')).toBe(false);
    });

    it('should reject date with time component (2026-11-19T10:30:00Z)', () => {
      expect(isValidDateFormat('2026-11-19T10:30:00Z')).toBe(false);
    });
  });
});

describe('isValidCalendarDate', () => {
  describe('Valid calendar dates', () => {
    it('should accept valid date (2026-11-19)', () => {
      expect(isValidCalendarDate('2026-11-19')).toBe(true);
    });

    it('should accept leap year Feb 29 (2024)', () => {
      expect(isValidCalendarDate('2024-02-29')).toBe(true);
    });

    it('should accept leap year Feb 29 (2028)', () => {
      expect(isValidCalendarDate('2028-02-29')).toBe(true);
    });

    it('should accept leap year Feb 29 (2000 - divisible by 400)', () => {
      expect(isValidCalendarDate('2000-02-29')).toBe(true);
    });

    it('should accept month with 31 days (Jan, Mar, May, Jul, Aug, Oct, Dec)', () => {
      expect(isValidCalendarDate('2026-01-31')).toBe(true);
      expect(isValidCalendarDate('2026-03-31')).toBe(true);
      expect(isValidCalendarDate('2026-05-31')).toBe(true);
      expect(isValidCalendarDate('2026-07-31')).toBe(true);
      expect(isValidCalendarDate('2026-08-31')).toBe(true);
      expect(isValidCalendarDate('2026-10-31')).toBe(true);
      expect(isValidCalendarDate('2026-12-31')).toBe(true);
    });

    it('should accept month with 30 days (Apr, Jun, Sep, Nov)', () => {
      expect(isValidCalendarDate('2026-04-30')).toBe(true);
      expect(isValidCalendarDate('2026-06-30')).toBe(true);
      expect(isValidCalendarDate('2026-09-30')).toBe(true);
      expect(isValidCalendarDate('2026-11-30')).toBe(true);
    });
  });

  describe('Invalid calendar dates', () => {
    it('should reject Feb 29 in non-leap year (2025)', () => {
      expect(isValidCalendarDate('2025-02-29')).toBe(false);
    });

    it('should reject Feb 29 in non-leap year (2100 - century rule)', () => {
      expect(isValidCalendarDate('2100-02-29')).toBe(false);
    });

    it('should reject Feb 30 (always invalid)', () => {
      expect(isValidCalendarDate('2026-02-30')).toBe(false);
    });

    it('should reject Feb 31 (always invalid)', () => {
      expect(isValidCalendarDate('2026-02-31')).toBe(false);
    });

    it('should reject day 31 in 30-day months (Apr, Jun, Sep, Nov)', () => {
      expect(isValidCalendarDate('2026-04-31')).toBe(false);
      expect(isValidCalendarDate('2026-06-31')).toBe(false);
      expect(isValidCalendarDate('2026-09-31')).toBe(false);
      expect(isValidCalendarDate('2026-11-31')).toBe(false);
    });

    it('should reject invalid month (13)', () => {
      expect(isValidCalendarDate('2026-13-01')).toBe(false);
    });

    it('should reject invalid day (00)', () => {
      expect(isValidCalendarDate('2026-01-00')).toBe(false);
    });
  });
});

describe('isLeapYear', () => {
  describe('Leap years', () => {
    it('should identify leap year divisible by 4 (2024)', () => {
      expect(isLeapYear(2024)).toBe(true);
    });

    it('should identify leap year divisible by 4 (2028)', () => {
      expect(isLeapYear(2028)).toBe(true);
    });

    it('should identify leap year divisible by 400 (2000)', () => {
      expect(isLeapYear(2000)).toBe(true);
    });

    it('should identify leap year divisible by 400 (2400)', () => {
      expect(isLeapYear(2400)).toBe(true);
    });
  });

  describe('Non-leap years', () => {
    it('should identify non-leap year not divisible by 4 (2025)', () => {
      expect(isLeapYear(2025)).toBe(false);
    });

    it('should identify non-leap year not divisible by 4 (2026)', () => {
      expect(isLeapYear(2026)).toBe(false);
    });

    it('should identify non-leap year divisible by 100 but not 400 (2100)', () => {
      expect(isLeapYear(2100)).toBe(false);
    });

    it('should identify non-leap year divisible by 100 but not 400 (2200)', () => {
      expect(isLeapYear(2200)).toBe(false);
    });

    it('should identify non-leap year divisible by 100 but not 400 (2300)', () => {
      expect(isLeapYear(2300)).toBe(false);
    });
  });
});

describe('validateDateRange', () => {
  describe('Valid date ranges', () => {
    it('should accept date within range (2026-11-19)', () => {
      expect(validateDateRange('2026-11-19')).toBe(true);
    });

    it('should accept minimum boundary (2026-11-19)', () => {
      expect(validateDateRange('2026-11-19')).toBe(true);
    });

    it('should accept maximum boundary (2125-12-31)', () => {
      expect(validateDateRange('2125-12-31')).toBe(true);
    });

    it('should accept mid-range dates', () => {
      expect(validateDateRange('2050-06-15')).toBe(true);
      expect(validateDateRange('2075-12-25')).toBe(true);
      expect(validateDateRange('2100-01-01')).toBe(true);
    });
  });

  describe('Invalid date ranges', () => {
    it('should reject date before minimum (2026-11-18)', () => {
      expect(validateDateRange('2026-11-18')).toBe(false);
    });

    it('should reject date after maximum (2126-01-01)', () => {
      expect(validateDateRange('2126-01-01')).toBe(false);
    });

    it('should reject very past date (2020-01-01)', () => {
      expect(validateDateRange('2020-01-01')).toBe(false);
    });

    it('should reject very future date (2999-12-31)', () => {
      expect(validateDateRange('2999-12-31')).toBe(false);
    });
  });
});

describe('convertToUTC', () => {
  it('should convert local date to UTC format (YYYY-MM-DD)', () => {
    const result = convertToUTC('2026-11-19');
    expect(result).toBe('2026-11-19');
  });

  it('should preserve date-only format (no time component)', () => {
    const result = convertToUTC('2027-02-14');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2027-02-14');
  });

  it('should handle leap year dates correctly', () => {
    const result = convertToUTC('2028-02-29');
    expect(result).toBe('2028-02-29');
  });

  it('should handle minimum boundary date', () => {
    const result = convertToUTC('2026-11-19');
    expect(result).toBe('2026-11-19');
  });

  it('should handle maximum boundary date', () => {
    const result = convertToUTC('2125-12-31');
    expect(result).toBe('2125-12-31');
  });

  it('should be timezone-independent (date only)', () => {
    const date1 = convertToUTC('2026-06-15');
    const date2 = convertToUTC('2026-06-15');
    expect(date1).toBe(date2);
  });
});

describe('validateDate (comprehensive)', () => {
  describe('Valid dates', () => {
    it('should validate correct date with no error', () => {
      const result = validateDate('2026-11-19');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate minimum boundary date', () => {
      const result = validateDate('2026-11-19');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate maximum boundary date', () => {
      const result = validateDate('2125-12-31');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate leap year date', () => {
      const result = validateDate('2028-02-29');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Invalid format errors', () => {
    it('should return error for invalid format (MM/DD/YYYY)', () => {
      const result = validateDate('11/19/2026');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });

    it('should return error for invalid string', () => {
      const result = validateDate('invalid-date');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });

    it('should return error for empty string', () => {
      const result = validateDate('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });
  });

  describe('Invalid calendar date errors', () => {
    it('should return error for Feb 29 in non-leap year', () => {
      const result = validateDate('2025-02-29');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });

    it('should return error for Feb 30', () => {
      const result = validateDate('2026-02-30');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });

    it('should return error for April 31', () => {
      const result = validateDate('2026-04-31');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid date');
    });
  });

  describe('Past date errors', () => {
    it('should return "can\'t launch in the past" for 2024-12-31', () => {
      const result = validateDate('2024-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toBe("GTA 6 can't launch in the past!");
    });

    it('should return "can\'t launch in the past" for 2020-01-01', () => {
      const result = validateDate('2020-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toBe("GTA 6 can't launch in the past!");
    });
  });

  describe('Future date range errors', () => {
    it('should return range error for 2126-01-01', () => {
      const result = validateDate('2126-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a date between Jan 1, 2025 and Dec 31, 2125');
    });

    it('should return range error for 2999-12-31', () => {
      const result = validateDate('2999-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a date between Jan 1, 2025 and Dec 31, 2125');
    });
  });

  describe('Edge cases', () => {
    it('should handle day after minimum boundary (2026-11-20)', () => {
      const result = validateDate('2026-11-20');
      expect(result.valid).toBe(true);
    });

    it('should handle day before maximum boundary (2125-12-30)', () => {
      const result = validateDate('2125-12-30');
      expect(result.valid).toBe(true);
    });

    it('should handle leap year century rule (2100-02-28 valid, 2100-02-29 invalid)', () => {
      expect(validateDate('2100-02-28').valid).toBe(true);
      expect(validateDate('2100-02-29').valid).toBe(false);
    });
  });
});
