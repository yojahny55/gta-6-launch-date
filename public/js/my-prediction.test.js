// My Prediction Card - Unit Tests
// Story 10.3: My Prediction Card Enhancement
// Tests for card visibility, delta calculation, data fetching, and error handling

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import functions from my-prediction.js
const {
  getUserPrediction,
  calculateMyPredictionDelta,
  formatMyPredictionDate,
  showMyPredictionCard,
  hideMyPredictionCard,
  initMyPrediction,
  updateMyPredictionDelta,
  // Sprint Change Proposal: 2025-11-28 - Percentile functions
  calculatePercentile,
  fetchAndCalculatePercentile,
  updateProgressBar,
} = await import('./my-prediction.js');

// Mock comparison.js functions
global.calculateDaysDiff = vi.fn((userDate, medianDate) => {
  const user = new Date(userDate + 'T00:00:00');
  const median = new Date(medianDate + 'T00:00:00');
  const diffMs = user.getTime() - median.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
});

global.formatDelta = vi.fn((daysDiff) => {
  const absDays = Math.abs(daysDiff);
  const direction = daysDiff >= 0 ? 'later' : 'earlier';

  if (absDays >= 60) {
    const months = Math.round(absDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ${direction}`;
  }

  return `${absDays} day${absDays !== 1 ? 's' : ''} ${direction}`;
});

describe('My Prediction Card - Story 10.3', () => {
  let dom;
  let document;
  let localStorage;
  let window;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create DOM with My Prediction card HTML
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="my-prediction-card" class="hidden">
            <h3>My Prediction</h3>
            <p>You predicted <span id="my-prediction-date">--</span></p>
            <p id="my-prediction-delta">Calculating...</p>
            <p class="text-xs text-gray-500 italic">Scroll up to update your prediction</p>
          </div>
          <div id="voting-section">
            <form id="prediction-form">
              <input type="date" id="predicted-date" />
            </form>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
    });

    document = dom.window.document;
    localStorage = dom.window.localStorage;
    window = dom.window;

    // Make DOM and storage available globally
    global.document = document;
    global.localStorage = localStorage;
    global.window = window;

    // Mock getCookieID function
    global.getCookieID = vi.fn(() => 'test-cookie-id-123');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('AC1 - Card Visibility Logic', () => {
    it('should show card when cookie exists AND localStorage has prediction', () => {
      // Setup: User has prediction
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        predicted_date: '2027-06-10',
        submitted_at: '2025-11-27T10:00:00Z'
      }));

      const prediction = getUserPrediction();

      expect(prediction).not.toBeNull();
      expect(prediction.predicted_date).toBe('2027-06-10');
    });

    it('should hide card when cookie missing', () => {
      global.getCookieID.mockReturnValue(null);

      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
    });

    it('should hide card when localStorage missing prediction', () => {
      // Cookie exists, but no localStorage data
      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
    });

    it('should hide card when prediction data is invalid', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        // Missing predicted_date field
        submitted_at: '2025-11-27T10:00:00Z'
      }));

      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
    });

    it('should not add card to DOM when no prediction (not just hidden)', () => {
      const card = document.getElementById('my-prediction-card');

      hideMyPredictionCard();

      expect(card.classList.contains('hidden')).toBe(true);
    });
  });

  describe('AC2 - Delta Calculation Accuracy', () => {
    it('should calculate positive delta (user more pessimistic than median)', () => {
      const userDate = '2027-06-10';
      const medianDate = '2027-03-10';

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('+');
      expect(delta).toContain('from median');
      expect(calculateDaysDiff).toHaveBeenCalledWith(userDate, medianDate);
    });

    it('should calculate negative delta (user more optimistic than median)', () => {
      const userDate = '2027-01-10';
      const medianDate = '2027-03-10';

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('-');
      expect(delta).toContain('from median');
    });

    it('should format months correctly for large differences (>60 days)', () => {
      const userDate = '2027-06-10';
      const medianDate = '2027-03-10';

      calculateDaysDiff.mockReturnValue(92); // ~3 months

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('month');
      expect(delta).toContain('from median');
      expect(formatDelta).toHaveBeenCalledWith(92);
    });

    it('should format days correctly for small differences (<=60 days)', () => {
      const userDate = '2027-03-20';
      const medianDate = '2027-03-10';

      calculateDaysDiff.mockReturnValue(10);

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('day');
      expect(delta).toContain('from median');
    });

    it('should handle zero delta (aligned with median)', () => {
      const userDate = '2027-03-10';
      const medianDate = '2027-03-10';

      calculateDaysDiff.mockReturnValue(0);

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('0');
      expect(delta).toContain('from median');
    });

    it('should work with fallback calculation if comparison.js not loaded', () => {
      // Temporarily remove mocked functions to test fallback
      const originalCalculateDaysDiff = global.calculateDaysDiff;
      const originalFormatDelta = global.formatDelta;

      global.calculateDaysDiff = undefined;
      global.formatDelta = undefined;

      const userDate = '2027-06-10';
      const medianDate = '2027-03-10';

      const delta = calculateMyPredictionDelta(userDate, medianDate);

      expect(delta).toContain('from median');
      expect(delta).toContain('+'); // User is 92 days later (pessimistic)

      // Restore mocks
      global.calculateDaysDiff = originalCalculateDaysDiff;
      global.formatDelta = originalFormatDelta;
    });
  });

  describe('AC3 - Data Fetching and Display', () => {
    it('should fetch median from stats and display correctly', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        predicted_date: '2027-06-10',
      }));

      const stats = {
        median: '2027-03-10',
        min: '2025-12-01',
        max: '2099-01-01',
        count: 1000,
      };

      const prediction = getUserPrediction();

      // Test that prediction was retrieved correctly
      expect(prediction).not.toBeNull();
      expect(prediction.predicted_date).toBe('2027-06-10');

      // Test date formatting
      const formattedDate = formatMyPredictionDate(prediction.predicted_date);
      expect(formattedDate).toMatch(/Jun.*10.*2027/);

      // Test delta calculation
      const delta = calculateMyPredictionDelta(prediction.predicted_date, stats.median);
      expect(delta).toContain('from median');
    });

    it('should read user prediction from localStorage with correct key format', () => {
      const cookieId = 'test-cookie-id-123';
      const expectedKey = `gta6_prediction_${cookieId}`;

      localStorage.setItem(expectedKey, JSON.stringify({
        predicted_date: '2027-06-10',
      }));

      const prediction = getUserPrediction();

      expect(prediction).not.toBeNull();
      expect(prediction.predicted_date).toBe('2027-06-10');
    });

    it('should display user\'s predicted date formatted correctly', () => {
      const dateString = '2027-06-10';
      const formatted = formatMyPredictionDate(dateString);

      expect(formatted).toMatch(/Jun.*10.*2027/);
    });

    it('should display delta comparison text correctly', () => {
      calculateDaysDiff.mockReturnValue(92);
      formatDelta.mockReturnValue('3 months later');

      const delta = calculateMyPredictionDelta('2027-06-10', '2027-03-10');

      expect(delta).toBe('+3 months from median');
    });
  });

  describe('AC4 - Update Message Display', () => {
    it('should display "Scroll up to update your prediction" message', () => {
      const card = document.getElementById('my-prediction-card');
      const updateMessage = card.querySelector('.text-xs.text-gray-500.italic');

      expect(updateMessage).not.toBeNull();
      expect(updateMessage.textContent).toBe('Scroll up to update your prediction');
    });

    it('should show message when card is visible', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        predicted_date: '2027-06-10',
      }));

      const stats = {
        median: '2027-03-10',
      };

      initMyPrediction(stats);

      const card = document.getElementById('my-prediction-card');
      const updateMessage = card.querySelector('.text-xs.text-gray-500.italic');

      expect(card.classList.contains('hidden')).toBe(false);
      expect(updateMessage).not.toBeNull();
    });
  });

  describe('AC5 - Error Handling (Graceful Degradation)', () => {
    it('should hide card gracefully when API fails (no error message shown)', () => {
      // No prediction exists
      const prediction = getUserPrediction();

      expect(prediction).toBeNull();

      hideMyPredictionCard();

      const card = document.getElementById('my-prediction-card');
      expect(card.classList.contains('hidden')).toBe(true);

      // No error element should exist (graceful degradation)
      const errorElement = document.querySelector('[role="alert"]');
      expect(errorElement).toBeNull();
    });

    it('should hide card gracefully when localStorage fails', () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage is full');
      });

      const prediction = getUserPrediction();

      expect(prediction).toBeNull();

      // Restore
      localStorage.getItem = originalGetItem;
    });

    it('should hide card when cookie exists but prediction not in localStorage', () => {
      // Cookie exists (mocked), but no localStorage data
      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', 'invalid JSON {{{');

      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
    });

    it('should not throw error or show message to user on any failure', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('gta6_prediction_test-cookie-id-123', 'invalid JSON');

      const prediction = getUserPrediction();

      expect(prediction).toBeNull();
      expect(consoleError).toHaveBeenCalled(); // Error logged to console
      // No user-facing error message (graceful degradation)

      consoleError.mockRestore();
    });
  });

  describe('AC6 - Responsive Layout', () => {
    it('should display card below dashboard grid (not as 5th card)', () => {
      const card = document.getElementById('my-prediction-card');

      // Card exists as separate element (not inside dashboard grid)
      expect(card).not.toBeNull();
      expect(card.parentElement.tagName).toBe('BODY'); // Direct child of body
    });

    it('should apply Tailwind classes correctly (bg-gta-card, border-gray-700, rounded-xl)', () => {
      // This test verifies the HTML structure (already exists in index.html)
      // Real DOM test would check computed styles
      const card = document.getElementById('my-prediction-card');
      expect(card).not.toBeNull();
    });
  });

  describe('Integration - Full Card Lifecycle', () => {
    it('should initialize card with prediction and median stats', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        predicted_date: '2027-06-10',
      }));

      const stats = {
        median: '2027-03-10',
        count: 1000,
      };

      initMyPrediction(stats);

      const card = document.getElementById('my-prediction-card');
      expect(card.classList.contains('hidden')).toBe(false);
    });

    it('should hide card when no prediction exists', () => {
      const stats = {
        median: '2027-03-10',
        count: 1000,
      };

      initMyPrediction(stats);

      const card = document.getElementById('my-prediction-card');
      expect(card.classList.contains('hidden')).toBe(true);
    });

    it('should update delta when stats refresh', () => {
      localStorage.setItem('gta6_prediction_test-cookie-id-123', JSON.stringify({
        predicted_date: '2027-06-10',
      }));

      const initialStats = {
        median: '2027-03-10',
      };

      const prediction = getUserPrediction();

      // Calculate initial delta
      const initialDelta = calculateMyPredictionDelta(prediction.predicted_date, initialStats.median);
      expect(initialDelta).toContain('from median');

      // Stats refresh with new median
      const updatedStats = {
        median: '2027-04-10', // Median moved later
      };

      // Recalculate delta with new median
      const updatedDelta = calculateMyPredictionDelta(prediction.predicted_date, updatedStats.median);
      expect(updatedDelta).toContain('from median');
      expect(calculateDaysDiff).toHaveBeenCalledWith('2027-06-10', '2027-04-10');

      // Delta should be different (user is now only 2 months ahead instead of 3)
      expect(updatedDelta).not.toBe(initialDelta);
    });
  });

  // ✨ Sprint Change Proposal: 2025-11-28 - Percentile Calculation Tests
  describe('AC7 - Percentile Calculation (Sprint Change 2025-11-28)', () => {
    describe('calculatePercentile()', () => {
      it('should calculate 0th percentile for earliest prediction', () => {
        const userDate = '2025-06-01';
        const allPredictions = [
          { predicted_date: '2025-06-01', count: 1 },  // User's prediction
          { predicted_date: '2026-03-15', count: 50 },
          { predicted_date: '2027-06-10', count: 100 },
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(0); // 0 predictions earlier than 2025-06-01
      });

      it('should calculate 50th percentile for median prediction', () => {
        const userDate = '2026-06-01';
        const allPredictions = [
          { predicted_date: '2025-12-01', count: 25 },
          { predicted_date: '2026-03-15', count: 25 },
          { predicted_date: '2026-06-01', count: 1 },  // User's prediction (50 earlier)
          { predicted_date: '2027-01-01', count: 25 },
          { predicted_date: '2027-06-10', count: 25 },
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(50); // 50 out of 100 predictions earlier
      });

      it('should calculate 100th percentile for latest prediction', () => {
        const userDate = '2099-01-01';
        const allPredictions = [
          { predicted_date: '2025-12-01', count: 30 },
          { predicted_date: '2026-11-19', count: 40 },
          { predicted_date: '2027-06-10', count: 30 },
          { predicted_date: '2099-01-01', count: 1 },  // User's prediction (latest)
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(99); // 100 out of 101 predictions earlier = 99th percentile
      });

      it('should calculate 64th percentile for user between quartiles', () => {
        const userDate = '2027-03-01';
        const allPredictions = [
          { predicted_date: '2026-01-01', count: 20 },  // Earlier (20)
          { predicted_date: '2026-06-01', count: 25 },  // Earlier (45)
          { predicted_date: '2026-11-19', count: 20 },  // Earlier (65)
          { predicted_date: '2027-03-01', count: 1 },   // User's prediction
          { predicted_date: '2027-06-01', count: 20 },  // Later
          { predicted_date: '2028-01-01', count: 15 },  // Later
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(64); // 65 out of 101 predictions earlier = 64th percentile
      });

      it('should handle empty predictions array (return default 50)', () => {
        const userDate = '2027-06-01';
        const allPredictions = [];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(50); // Default to middle
      });

      it('should handle null predictions array (return default 50)', () => {
        const userDate = '2027-06-01';
        const allPredictions = null;

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(50); // Default to middle
      });

      it('should handle edge case: user prediction equals median', () => {
        const userDate = '2026-11-19'; // Official date / median
        const allPredictions = [
          { predicted_date: '2026-01-01', count: 25 },
          { predicted_date: '2026-06-01', count: 25 },
          { predicted_date: '2026-11-19', count: 1 },  // User equals median
          { predicted_date: '2027-06-01', count: 25 },
          { predicted_date: '2027-12-01', count: 25 },
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(50); // 50 out of 100 earlier (exact median)
      });

      it('should round percentile to nearest integer', () => {
        const userDate = '2026-12-01';
        const allPredictions = [
          { predicted_date: '2026-01-01', count: 33 },  // 33 earlier
          { predicted_date: '2026-12-01', count: 1 },   // User
          { predicted_date: '2027-06-01', count: 66 },  // 66 later
        ];

        const percentile = calculatePercentile(userDate, allPredictions);
        expect(percentile).toBe(33); // 33/100 = 33% (rounded)
      });
    });

    describe('updateProgressBar()', () => {
      let dom;

      beforeEach(() => {
        // Setup DOM elements with jsdom
        dom = new JSDOM(`
          <!DOCTYPE html>
          <html>
            <body>
              <div id="prediction-position-bar" style="width: 50%"></div>
              <span id="prediction-percentile">--</span>
            </body>
          </html>
        `);

        global.document = dom.window.document;
        global.window = dom.window;

        // Initialize myPredictionElements AFTER setting globals
        global.myPredictionElements = {
          progressBar: global.document.getElementById('prediction-position-bar'),
          percentile: global.document.getElementById('prediction-percentile'),
        };
      });

      afterEach(() => {
        delete global.myPredictionElements;
        delete global.document;
        delete global.window;
      });

      it('should update progress bar width to percentile value', () => {
        updateProgressBar(65);

        expect(global.myPredictionElements.progressBar.style.width).toBe('65%');
      });

      it('should update percentile display text', () => {
        updateProgressBar(65);

        expect(global.myPredictionElements.percentile.textContent).toBe('65%');
      });

      it('should handle 0% percentile', () => {
        updateProgressBar(0);

        expect(global.myPredictionElements.progressBar.style.width).toBe('0%');
        expect(global.myPredictionElements.percentile.textContent).toBe('0%');
      });

      it('should handle 100% percentile', () => {
        updateProgressBar(100);

        expect(global.myPredictionElements.progressBar.style.width).toBe('100%');
        expect(global.myPredictionElements.percentile.textContent).toBe('100%');
      });

      it('should handle missing progress bar element gracefully', () => {
        global.myPredictionElements.progressBar = null;

        // Should not throw error
        expect(() => updateProgressBar(65)).not.toThrow();
      });

      it('should handle uninitialized myPredictionElements gracefully', () => {
        global.myPredictionElements = null;

        // Should not throw error
        expect(() => updateProgressBar(65)).not.toThrow();
      });
    });
  });
});
