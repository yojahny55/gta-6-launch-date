import { describe, it, expect } from 'vitest';
import {
  calculateStatus,
  isValidDate,
  OFFICIAL_RELEASE_DATE,
  STATUS_THRESHOLDS,
  type StatusResult,
} from './status-calculator';

describe('Status Calculator', () => {
  describe('calculateStatus', () => {
    describe('Early Release Possible (Green)', () => {
      it('should return "Early Release Possible" when median is 90 days before official', () => {
        const medianDate = '2026-08-21'; // 90 days before 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Early Release Possible');
        expect(result.color).toBe('green');
        expect(result.daysDifference).toBe(-90);
      });

      it('should return "Early Release Possible" when median is 61 days before official', () => {
        const medianDate = '2026-09-19'; // 61 days before 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Early Release Possible');
        expect(result.color).toBe('green');
        expect(result.daysDifference).toBe(-61);
      });

      it('should return "Early Release Possible" when median is significantly before official', () => {
        const medianDate = '2025-06-15'; // Way before official
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Early Release Possible');
        expect(result.color).toBe('green');
        expect(result.daysDifference).toBeLessThan(STATUS_THRESHOLDS.EARLY_RELEASE);
      });
    });

    describe('On Track (Blue)', () => {
      it('should return "On Track" when median exactly matches official date', () => {
        const medianDate = OFFICIAL_RELEASE_DATE; // Exactly 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
        expect(result.daysDifference).toBe(0);
      });

      it('should return "On Track" when median is 30 days after official', () => {
        const medianDate = '2026-12-19'; // 30 days after 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
        expect(result.daysDifference).toBe(30);
      });

      it('should return "On Track" when median is 30 days before official', () => {
        const medianDate = '2026-10-20'; // 30 days before 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
        expect(result.daysDifference).toBe(-30);
      });

      it('should return "On Track" at lower boundary (-60 days)', () => {
        const medianDate = '2026-09-20'; // Exactly -60 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
        expect(result.daysDifference).toBe(-60);
      });

      it('should return "On Track" at upper boundary (+60 days)', () => {
        const medianDate = '2027-01-18'; // Exactly +60 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
        expect(result.daysDifference).toBe(60);
      });
    });

    describe('Delay Likely (Amber)', () => {
      it('should return "Delay Likely" when median is 90 days after official', () => {
        const medianDate = '2027-02-17'; // 90 days after 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
        expect(result.daysDifference).toBe(90);
      });

      it('should return "Delay Likely" when median is 61 days after official', () => {
        const medianDate = '2027-01-19'; // 61 days after 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
        expect(result.daysDifference).toBe(61);
      });

      it('should return "Delay Likely" at upper boundary (+180 days)', () => {
        const medianDate = '2027-05-18'; // Exactly +180 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
        expect(result.daysDifference).toBe(180);
      });

      it('should return "Delay Likely" for moderate delays', () => {
        const medianDate = '2027-03-15'; // ~116 days after official
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
        expect(result.daysDifference).toBeGreaterThan(STATUS_THRESHOLDS.ON_TRACK_MAX);
        expect(result.daysDifference).toBeLessThanOrEqual(STATUS_THRESHOLDS.DELAY_LIKELY_MAX);
      });
    });

    describe('Major Delay Expected (Red)', () => {
      it('should return "Major Delay Expected" when median is 200 days after official', () => {
        const medianDate = '2027-06-07'; // 200 days after 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
        expect(result.daysDifference).toBe(200);
      });

      it('should return "Major Delay Expected" when median is 181 days after official', () => {
        const medianDate = '2027-05-19'; // 181 days after 2026-11-19
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
        expect(result.daysDifference).toBe(181);
      });

      it('should return "Major Delay Expected" for extreme delays', () => {
        const medianDate = '2028-11-19'; // 2 years after official
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
        expect(result.daysDifference).toBeGreaterThan(STATUS_THRESHOLDS.DELAY_LIKELY_MAX);
      });

      it('should return "Major Delay Expected" for troll predictions (2099)', () => {
        const medianDate = '2099-12-31'; // Way in the future
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
        expect(result.daysDifference).toBeGreaterThan(20000); // Many years later
      });
    });

    describe('Boundary Testing', () => {
      it('should handle boundary at -61 days (Early Release)', () => {
        const medianDate = '2026-09-19'; // -61 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Early Release Possible');
        expect(result.color).toBe('green');
      });

      it('should handle boundary at -60 days (On Track)', () => {
        const medianDate = '2026-09-20'; // -60 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
      });

      it('should handle boundary at +60 days (On Track)', () => {
        const medianDate = '2027-01-18'; // +60 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('On Track');
        expect(result.color).toBe('blue');
      });

      it('should handle boundary at +61 days (Delay Likely)', () => {
        const medianDate = '2027-01-19'; // +61 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
      });

      it('should handle boundary at +180 days (Delay Likely)', () => {
        const medianDate = '2027-05-18'; // +180 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Delay Likely');
        expect(result.color).toBe('amber');
      });

      it('should handle boundary at +181 days (Major Delay)', () => {
        const medianDate = '2027-05-19'; // +181 days
        const result = calculateStatus(medianDate);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
      });
    });

    describe('Custom Official Date', () => {
      it('should accept custom official date parameter', () => {
        const medianDate = '2027-01-01';
        const customOfficial = '2026-01-01';
        const result = calculateStatus(medianDate, customOfficial);

        expect(result.status).toBe('Major Delay Expected');
        expect(result.color).toBe('red');
        expect(result.daysDifference).toBe(365); // 1 year later
      });

      it('should default to OFFICIAL_RELEASE_DATE when not provided', () => {
        const medianDate = '2026-11-19';
        const result = calculateStatus(medianDate);

        expect(result.daysDifference).toBe(0);
      });
    });

    describe('Return Type Validation', () => {
      it('should return StatusResult with all required fields', () => {
        const medianDate = '2027-03-15';
        const result = calculateStatus(medianDate);

        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('daysDifference');
        expect(typeof result.status).toBe('string');
        expect(typeof result.color).toBe('string');
        expect(typeof result.daysDifference).toBe('number');
      });
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid ISO 8601 date', () => {
      expect(isValidDate('2026-11-19')).toBe(true);
      expect(isValidDate('2027-03-15')).toBe(true);
      expect(isValidDate('2025-01-01')).toBe(true);
    });

    it('should return false for invalid date format', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2026-13-45')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('should return false for non-date strings', () => {
      expect(isValidDate('hello world')).toBe(false);
      expect(isValidDate('12345')).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should export OFFICIAL_RELEASE_DATE constant', () => {
      expect(OFFICIAL_RELEASE_DATE).toBe('2026-11-19');
    });

    it('should export STATUS_THRESHOLDS with correct values', () => {
      expect(STATUS_THRESHOLDS.EARLY_RELEASE).toBe(-60);
      expect(STATUS_THRESHOLDS.ON_TRACK_MIN).toBe(-60);
      expect(STATUS_THRESHOLDS.ON_TRACK_MAX).toBe(60);
      expect(STATUS_THRESHOLDS.DELAY_LIKELY_MAX).toBe(180);
    });
  });
});
