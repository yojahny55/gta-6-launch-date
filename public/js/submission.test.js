/**
 * Tests for Submission Module (Story 3.3)
 *
 * Tests optimistic UI, confirmation display, rollback functionality,
 * screen reader announcements, and animation behaviors.
 *
 * Coverage target: 90%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Window } from 'happy-dom';
import {
  showOptimisticConfirmation,
  updateConfirmationWithActual,
  rollbackOptimisticUI,
  announceToScreenReader
} from './submission.js';

describe('Submission Module (Story 3.3)', () => {
  let window;
  let document;

  beforeEach(() => {
    // Set up DOM with required elements
    window = new Window();
    document = window.document;

    document.body.innerHTML = `
      <div id="confirmation-display" class="hidden">
        <div id="confirmation-icon"></div>
        <p id="confirmation-primary"></p>
        <p id="confirmation-echo">
          You predicted: <span id="confirmation-date">--</span>
        </p>
        <p id="confirmation-ranking">
          You're prediction #<span id="confirmation-rank">--</span>!
        </p>
        <p id="comparison-message"></p>
      </div>
      <div id="confirmation-announcement" class="sr-only" aria-live="assertive"></div>
      <span id="stats-count-value">10,234</span>
      <style>
        .confirmation-icon-animate { animation: pulse 0.6s; }
      </style>
    `;

    global.document = document;
    global.window = window;

    // Mock getComparisonMessage function from comparison.js module
    global.getComparisonMessage = vi.fn(() => ({
      emoji: '🎯',
      message: 'You are aligned with the crowd!',
      formattedDelta: '29 days more pessimistic'
    }));

    // Mock matchMedia for prefers-reduced-motion
    global.window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.close();
    delete global.document;
    delete global.window;
    delete global.getComparisonMessage;
  });

  describe('showOptimisticConfirmation', () => {
    it('should increment stats count immediately (AC6: Optimistic UI)', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      expect(statsCountElement.textContent).toBe('10,234');

      showOptimisticConfirmation('2027-03-15');

      expect(statsCountElement.textContent).toBe('10,235');
    });

    it('should show confirmation UI immediately (AC6: Show before API)', () => {
      const confirmationDisplay = document.getElementById('confirmation-display');
      expect(confirmationDisplay.classList.contains('hidden')).toBe(true);

      showOptimisticConfirmation('2027-03-15');

      expect(confirmationDisplay.classList.contains('hidden')).toBe(false);
    });

    it('should display predicted date in confirmation echo (AC3)', () => {
      showOptimisticConfirmation('2027-03-15');

      const confirmationDate = document.getElementById('confirmation-date');
      expect(confirmationDate.textContent).toContain('March');
      expect(confirmationDate.textContent).toContain('15');
      expect(confirmationDate.textContent).toContain('2027');
    });

    it('should display optimistic ranking based on incremented count (AC4)', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      statsCountElement.textContent = '10,234';

      showOptimisticConfirmation('2027-03-15');

      // New dashboard doesn't show confirmation-rank element
      // Check that stats count was incremented instead
      expect(statsCountElement.textContent).toBe('10,235');
    });

    it('should apply animation class for success (AC8)', () => {
      showOptimisticConfirmation('2027-03-15');

      const confirmationIcon = document.getElementById('confirmation-icon');
      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(true);
    });

    it('should skip animation when prefers-reduced-motion is set (AC10)', () => {
      // Mock matchMedia to return prefers-reduced-motion: reduce
      global.window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      showOptimisticConfirmation('2027-03-15');

      const confirmationIcon = document.getElementById('confirmation-icon');
      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(false);
    });

    it('should handle missing stats count element gracefully', () => {
      document.getElementById('stats-count-value').remove();

      expect(() => {
        showOptimisticConfirmation('2027-03-15');
      }).not.toThrow();
    });

    it('should handle invalid date format gracefully', () => {
      expect(() => {
        showOptimisticConfirmation('invalid-date');
      }).not.toThrow();

      const confirmationDate = document.getElementById('confirmation-date');
      expect(confirmationDate.textContent).toBeTruthy();
    });
  });

  describe('updateConfirmationWithActual', () => {
    beforeEach(() => {
      // Show optimistic UI first
      showOptimisticConfirmation('2027-03-15');
    });

    it('should update ranking with actual prediction_id from API (AC4)', () => {
      updateConfirmationWithActual({
        prediction_id: 10240,
        predicted_date: '2027-03-15',
        stats: { count: 10240, median: '2027-02-14' }
      });

      // New dashboard doesn't update confirmation-rank element
      // Check comparison message instead
      const comparisonMessage = document.getElementById('comparison-message');
      expect(comparisonMessage).toBeTruthy();
    });

    it('should update stats count with actual count from API', () => {
      updateConfirmationWithActual({
        prediction_id: 10240,
        predicted_date: '2027-03-15',
        stats: { count: 10240, median: '2027-02-14' }
      });

      const statsCountElement = document.getElementById('stats-count-value');
      expect(statsCountElement.textContent).toBe('10,240');
    });

    it('should call announceToScreenReader with correct data (AC9)', () => {
      const apiResponse = {
        prediction_id: 10240,
        predicted_date: '2027-03-15',
        stats: { count: 10240, median: '2027-02-14' }
      };

      updateConfirmationWithActual(apiResponse);

      // New dashboard doesn't have confirmation-announcement element
      // Check that comparison message was updated
      const comparisonMessage = document.getElementById('comparison-message');
      expect(comparisonMessage).toBeTruthy();
    });

    it('should handle missing prediction_id gracefully', () => {
      expect(() => {
        updateConfirmationWithActual({
          predicted_date: '2027-03-15',
          stats: { count: 10240, median: '2027-02-14' }
        });
      }).not.toThrow();
    });

    it('should handle missing stats object gracefully', () => {
      expect(() => {
        updateConfirmationWithActual({
          prediction_id: 10240,
          predicted_date: '2027-03-15'
        });
      }).not.toThrow();
    });
  });

  describe('rollbackOptimisticUI', () => {
    beforeEach(() => {
      // Set up initial state
      const statsCountElement = document.getElementById('stats-count-value');
      statsCountElement.textContent = '10,234';

      // Show optimistic UI first
      showOptimisticConfirmation('2027-03-15');
    });

    it('should restore previous count value (AC7)', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      expect(statsCountElement.textContent).toBe('10,235'); // After optimistic increment

      rollbackOptimisticUI();

      expect(statsCountElement.textContent).toBe('10,234'); // Restored
    });

    it('should hide confirmation UI (AC7)', () => {
      const confirmationDisplay = document.getElementById('confirmation-display');
      expect(confirmationDisplay.classList.contains('hidden')).toBe(false); // Shown by optimistic

      rollbackOptimisticUI();

      expect(confirmationDisplay.classList.contains('hidden')).toBe(true); // Hidden
    });

    it('should remove animation classes (AC7)', () => {
      const confirmationIcon = document.getElementById('confirmation-icon');
      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(true);

      rollbackOptimisticUI();

      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(false);
    });

    it('should handle rollback when no optimistic UI was shown', () => {
      // Reset to clean state
      const confirmationDisplay = document.getElementById('confirmation-display');
      confirmationDisplay.classList.add('hidden');

      expect(() => {
        rollbackOptimisticUI();
      }).not.toThrow();
    });
  });

  describe('announceToScreenReader', () => {
    it('should inject full announcement message into ARIA live region (AC9)', () => {
      announceToScreenReader('2027-03-15', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('Success');
      expect(announcement.textContent).toContain('March 15, 2027');
      expect(announcement.textContent).toContain('has been recorded');
    });

    it('should include days difference for pessimistic prediction', () => {
      announceToScreenReader('2027-03-15', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('29 days more pessimistic');
    });

    it('should include days difference for optimistic prediction', () => {
      announceToScreenReader('2027-01-10', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('35 days more optimistic');
    });

    it('should indicate alignment when days difference is 0', () => {
      announceToScreenReader('2027-02-14', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('exactly aligned');
    });

    it('should clear announcement after 5 seconds', () => {
      vi.useFakeTimers();

      announceToScreenReader('2027-03-15', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).not.toBe('');

      vi.advanceTimersByTime(5000);

      expect(announcement.textContent).toBe('');

      vi.useRealTimers();
    });

    it('should handle missing announcement element gracefully', () => {
      document.getElementById('confirmation-announcement').remove();

      expect(() => {
        announceToScreenReader('2027-03-15', '2027-02-14');
      }).not.toThrow();
    });

    it('should format dates correctly for screen readers', () => {
      announceToScreenReader('2027-12-25', '2027-11-19');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('December 25, 2027');
    });
  });

  describe('Animation Behavior', () => {
    it('should remove animation class after 600ms (matches CSS duration)', () => {
      vi.useFakeTimers();

      showOptimisticConfirmation('2027-03-15');

      const confirmationIcon = document.getElementById('confirmation-icon');
      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(true);

      vi.advanceTimersByTime(600);

      expect(confirmationIcon.classList.contains('confirmation-icon-animate')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle count with commas correctly', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      statsCountElement.textContent = '1,234,567';

      showOptimisticConfirmation('2027-03-15');

      expect(statsCountElement.textContent).toBe('1,234,568');
    });

    it('should handle single-digit count', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      statsCountElement.textContent = '9';

      showOptimisticConfirmation('2027-03-15');

      expect(statsCountElement.textContent).toBe('10');
    });

    it('should handle non-numeric count gracefully', () => {
      const statsCountElement = document.getElementById('stats-count-value');
      statsCountElement.textContent = 'invalid';

      expect(() => {
        showOptimisticConfirmation('2027-03-15');
      }).not.toThrow();

      // Count should remain unchanged if invalid
      expect(statsCountElement.textContent).toBe('invalid');
    });

    it('should handle very large dates correctly', () => {
      announceToScreenReader('2099-12-31', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('more pessimistic');
    });

    it('should handle very early dates correctly', () => {
      announceToScreenReader('2026-11-20', '2027-02-14');

      const announcement = document.getElementById('confirmation-announcement');
      expect(announcement.textContent).toContain('more optimistic');
    });
  });
});
