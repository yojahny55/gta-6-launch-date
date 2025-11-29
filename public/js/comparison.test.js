// GTA 6 Tracker - Social Comparison Module Tests
// Story 3.2: Social Comparison Messaging
// Testing Requirements: 100% coverage for comparison logic

import { describe, it, expect } from 'vitest';
import {
  getComparisonMessage,
  getPersonalityMessage,
  formatDelta,
  calculateDaysDiff,
  getDirection,
  getDirectionEmoji,
  COMPARISON_THRESHOLDS
} from './comparison.js';

// ============================================================================
// Test Suite: calculateDaysDiff
// ============================================================================

describe('calculateDaysDiff', () => {
  it('should return 0 for same dates', () => {
    const date = '2027-02-14';
    expect(calculateDaysDiff(date, date)).toBe(0);
  });

  it('should return positive days when user date is later (pessimistic)', () => {
    const userDate = '2027-03-15';  // 29 days later
    const medianDate = '2027-02-14';
    expect(calculateDaysDiff(userDate, medianDate)).toBe(29);
  });

  it('should return negative days when user date is earlier (optimistic)', () => {
    const userDate = '2027-01-15';  // 30 days earlier
    const medianDate = '2027-02-14';
    expect(calculateDaysDiff(userDate, medianDate)).toBe(-30);
  });

  it('should handle Date objects', () => {
    const userDate = new Date('2027-03-15');
    const medianDate = new Date('2027-02-14');
    expect(calculateDaysDiff(userDate, medianDate)).toBe(29);
  });

  it('should handle string dates', () => {
    expect(calculateDaysDiff('2027-03-15', '2027-02-14')).toBe(29);
  });
});

// ============================================================================
// Test Suite: getDirection
// ============================================================================

describe('getDirection', () => {
  it('should return "aligned" for 0 days difference', () => {
    expect(getDirection(0)).toBe('aligned');
  });

  it('should return "pessimistic" for positive days (user later than median)', () => {
    expect(getDirection(1)).toBe('pessimistic');
    expect(getDirection(30)).toBe('pessimistic');
    expect(getDirection(100)).toBe('pessimistic');
  });

  it('should return "optimistic" for negative days (user earlier than median)', () => {
    expect(getDirection(-1)).toBe('optimistic');
    expect(getDirection(-30)).toBe('optimistic');
    expect(getDirection(-100)).toBe('optimistic');
  });
});

// ============================================================================
// Test Suite: getDirectionEmoji
// ============================================================================

describe('getDirectionEmoji', () => {
  it('should return correct emoji for each direction', () => {
    expect(getDirectionEmoji('aligned')).toBe('🎯');
    expect(getDirectionEmoji('optimistic')).toBe('🤞');
    expect(getDirectionEmoji('pessimistic')).toBe('😬');
  });
});

// ============================================================================
// Test Suite: getPersonalityMessage
// AC4: Personality thresholds
// ============================================================================

describe('getPersonalityMessage', () => {
  describe('0 days (ALIGNED)', () => {
    it('should return "Great minds think alike!" for 0 days', () => {
      expect(getPersonalityMessage(0)).toBe("Great minds think alike!");
    });
  });

  describe('1-30 days (CLOSE)', () => {
    it('should return "Pretty close to the crowd" for 1 day', () => {
      expect(getPersonalityMessage(1)).toBe("Pretty close to the crowd");
      expect(getPersonalityMessage(-1)).toBe("Pretty close to the crowd");
    });

    it('should return "Pretty close to the crowd" for 15 days', () => {
      expect(getPersonalityMessage(15)).toBe("Pretty close to the crowd");
      expect(getPersonalityMessage(-15)).toBe("Pretty close to the crowd");
    });

    it('should return "Pretty close to the crowd" for exactly 30 days (boundary)', () => {
      expect(getPersonalityMessage(30)).toBe("Pretty close to the crowd");
      expect(getPersonalityMessage(-30)).toBe("Pretty close to the crowd");
    });
  });

  describe('31-90 days (DIFFERENT)', () => {
    it('should return "You have a different perspective" for 31 days', () => {
      expect(getPersonalityMessage(31)).toBe("You have a different perspective");
      expect(getPersonalityMessage(-31)).toBe("You have a different perspective");
    });

    it('should return "You have a different perspective" for 60 days', () => {
      expect(getPersonalityMessage(60)).toBe("You have a different perspective");
      expect(getPersonalityMessage(-60)).toBe("You have a different perspective");
    });

    it('should return "You have a different perspective" for exactly 90 days (boundary)', () => {
      expect(getPersonalityMessage(90)).toBe("You have a different perspective");
      expect(getPersonalityMessage(-90)).toBe("You have a different perspective");
    });
  });

  describe('91-180 days (BOLD)', () => {
    it('should return "Bold prediction!" for 91 days', () => {
      expect(getPersonalityMessage(91)).toBe("Bold prediction!");
      expect(getPersonalityMessage(-91)).toBe("Bold prediction!");
    });

    it('should return "Bold prediction!" for 120 days', () => {
      expect(getPersonalityMessage(120)).toBe("Bold prediction!");
      expect(getPersonalityMessage(-120)).toBe("Bold prediction!");
    });

    it('should return "Bold prediction!" for exactly 180 days (boundary)', () => {
      expect(getPersonalityMessage(180)).toBe("Bold prediction!");
      expect(getPersonalityMessage(-180)).toBe("Bold prediction!");
    });
  });

  describe('181+ days (EXTREME)', () => {
    it('should return "Wow, you\'re way outside the consensus!" for 181 days', () => {
      expect(getPersonalityMessage(181)).toBe("Wow, you're way outside the consensus!");
      expect(getPersonalityMessage(-181)).toBe("Wow, you're way outside the consensus!");
    });

    it('should return "Wow, you\'re way outside the consensus!" for 365 days', () => {
      expect(getPersonalityMessage(365)).toBe("Wow, you're way outside the consensus!");
      expect(getPersonalityMessage(-365)).toBe("Wow, you're way outside the consensus!");
    });
  });
});

// ============================================================================
// Test Suite: formatDelta
// AC5: Large differences shown in months (> 60 days)
// ============================================================================

describe('formatDelta', () => {
  describe('Days formatting (< 60 days)', () => {
    it('should format 1 day correctly (singular)', () => {
      expect(formatDelta(1)).toBe('1 day later');
      expect(formatDelta(-1)).toBe('1 day earlier');
    });

    it('should format multiple days correctly (plural)', () => {
      expect(formatDelta(29)).toBe('29 days later');
      expect(formatDelta(-29)).toBe('29 days earlier');
    });

    it('should format exactly 59 days in days (boundary)', () => {
      expect(formatDelta(59)).toBe('59 days later');
      expect(formatDelta(-59)).toBe('59 days earlier');
    });
  });

  describe('Months formatting (>= 60 days)', () => {
    it('should format 60 days as 2 months', () => {
      expect(formatDelta(60)).toBe('2 months later');
      expect(formatDelta(-60)).toBe('2 months earlier');
    });

    it('should format 90 days as 3 months', () => {
      expect(formatDelta(90)).toBe('3 months later');
      expect(formatDelta(-90)).toBe('3 months earlier');
    });

    it('should format 120 days as 4 months', () => {
      expect(formatDelta(120)).toBe('4 months later');
      expect(formatDelta(-120)).toBe('4 months earlier');
    });

    it('should format 365 days as 12 months', () => {
      expect(formatDelta(365)).toBe('12 months later');
      expect(formatDelta(-365)).toBe('12 months earlier');
    });

    it('should use singular "month" for exactly 30 days (1 month)', () => {
      // 30 days rounds to 1 month
      // Note: We're checking < 60 so 30 shows as "30 days"
      expect(formatDelta(30)).toBe('30 days later');
    });
  });

  describe('Direction labels', () => {
    it('should use "later" for positive days', () => {
      expect(formatDelta(10)).toContain('later');
      expect(formatDelta(100)).toContain('later');
    });

    it('should use "earlier" for negative days', () => {
      expect(formatDelta(-10)).toContain('earlier');
      expect(formatDelta(-100)).toContain('earlier');
    });
  });
});

// ============================================================================
// Test Suite: getComparisonMessage (Integration)
// Tests all acceptance criteria together
// ============================================================================

describe('getComparisonMessage', () => {
  describe('Aligned (0 days difference)', () => {
    it('should return aligned comparison for same dates', () => {
      const result = getComparisonMessage('2027-02-14', '2027-02-14');

      expect(result.daysDiff).toBe(0);
      expect(result.direction).toBe('aligned');
      expect(result.emoji).toBe('🎯');
      expect(result.message).toBe("You're exactly aligned with the community!");
      expect(result.personality).toBe("Great minds think alike!");
      expect(result.formattedDelta).toBe('0 days later');
    });
  });

  describe('Optimistic (user earlier than median)', () => {
    it('should return optimistic comparison for 15 days earlier', () => {
      const result = getComparisonMessage('2027-01-30', '2027-02-14');

      expect(result.daysDiff).toBe(-15);
      expect(result.direction).toBe('optimistic');
      expect(result.emoji).toBe('🤞');
      expect(result.message).toBe("You're 15 days more optimistic than the community");
      expect(result.personality).toBe("Pretty close to the crowd");
      expect(result.formattedDelta).toBe('15 days earlier');
    });

    it('should return optimistic comparison for 60 days earlier (months)', () => {
      const result = getComparisonMessage('2026-12-16', '2027-02-14');

      expect(result.daysDiff).toBe(-60);
      expect(result.direction).toBe('optimistic');
      expect(result.emoji).toBe('🤞');
      expect(result.message).toBe("You're 60 days more optimistic than the community");
      expect(result.personality).toBe("You have a different perspective");
      expect(result.formattedDelta).toBe('2 months earlier');
    });
  });

  describe('Pessimistic (user later than median)', () => {
    it('should return pessimistic comparison for 29 days later', () => {
      const result = getComparisonMessage('2027-03-15', '2027-02-14');

      expect(result.daysDiff).toBe(29);
      expect(result.direction).toBe('pessimistic');
      expect(result.emoji).toBe('😬');
      expect(result.message).toBe("You're 29 days more pessimistic than the community");
      expect(result.personality).toBe("Pretty close to the crowd");
      expect(result.formattedDelta).toBe('29 days later');
    });

    it('should return pessimistic comparison for 120 days later (months)', () => {
      const result = getComparisonMessage('2027-06-14', '2027-02-14');

      expect(result.daysDiff).toBe(120);
      expect(result.direction).toBe('pessimistic');
      expect(result.emoji).toBe('😬');
      expect(result.message).toBe("You're 120 days more pessimistic than the community");
      expect(result.personality).toBe("Bold prediction!");
      expect(result.formattedDelta).toBe('4 months later');
    });
  });

  describe('Boundary conditions', () => {
    it('should handle exactly 30 days (CLOSE boundary)', () => {
      const result = getComparisonMessage('2027-03-16', '2027-02-14');

      expect(result.daysDiff).toBe(30);
      expect(result.personality).toBe("Pretty close to the crowd");
    });

    it('should handle exactly 31 days (DIFFERENT threshold)', () => {
      const result = getComparisonMessage('2027-03-17', '2027-02-14');

      expect(result.daysDiff).toBe(31);
      expect(result.personality).toBe("You have a different perspective");
    });

    it('should handle exactly 90 days (DIFFERENT boundary)', () => {
      const result = getComparisonMessage('2027-05-15', '2027-02-14');

      expect(result.daysDiff).toBe(90);
      expect(result.personality).toBe("You have a different perspective");
    });

    it('should handle exactly 91 days (BOLD threshold)', () => {
      const result = getComparisonMessage('2027-05-16', '2027-02-14');

      expect(result.daysDiff).toBe(91);
      expect(result.personality).toBe("Bold prediction!");
    });

    it('should handle exactly 180 days (BOLD boundary)', () => {
      const result = getComparisonMessage('2027-08-13', '2027-02-14');

      expect(result.daysDiff).toBe(180);
      expect(result.personality).toBe("Bold prediction!");
    });

    it('should handle exactly 181 days (EXTREME threshold)', () => {
      const result = getComparisonMessage('2027-08-14', '2027-02-14');

      expect(result.daysDiff).toBe(181);
      expect(result.personality).toBe("Wow, you're way outside the consensus!");
    });
  });

  describe('Date object support', () => {
    it('should work with Date objects', () => {
      const userDate = new Date('2027-03-15');
      const medianDate = new Date('2027-02-14');
      const result = getComparisonMessage(userDate, medianDate);

      expect(result.daysDiff).toBe(29);
      expect(result.direction).toBe('pessimistic');
    });
  });

  describe('All properties present', () => {
    it('should return all required properties', () => {
      const result = getComparisonMessage('2027-03-15', '2027-02-14');

      expect(result).toHaveProperty('daysDiff');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('personality');
      expect(result).toHaveProperty('emoji');
      expect(result).toHaveProperty('formattedDelta');
    });
  });
});

// ============================================================================
// Test Suite: COMPARISON_THRESHOLDS constants
// ============================================================================

describe('COMPARISON_THRESHOLDS', () => {
  it('should have correct threshold values', () => {
    expect(COMPARISON_THRESHOLDS.ALIGNED).toBe(0);
    expect(COMPARISON_THRESHOLDS.CLOSE).toBe(30);
    expect(COMPARISON_THRESHOLDS.DIFFERENT).toBe(90);
    expect(COMPARISON_THRESHOLDS.BOLD).toBe(180);
    expect(COMPARISON_THRESHOLDS.EXTREME).toBe(Infinity);
  });
});
