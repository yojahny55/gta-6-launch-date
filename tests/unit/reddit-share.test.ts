/**
 * Unit Tests for Reddit Share Module (Story 5.2)
 *
 * Tests cover:
 * - Reddit post text generation with various dates
 * - Personalization logic (optimistic/pessimistic/aligned)
 * - URL encoding correctness
 * - Tracking parameter generation
 * - Share button functionality
 *
 * Test Coverage Target: >80% (ADR-011)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import functions from reddit-share.js
// Note: Using dynamic import to handle ES modules in test environment
let generateRedditPost: any;
let generateRedditSubmitUrl: any;
let generateShareUrl: any;
let openRedditShare: any;
let trackShareClick: any;

beforeEach(async () => {
  // Dynamic import of reddit-share module
  const module = await import('../../public/js/reddit-share.js');
  generateRedditPost = module.generateRedditPost;
  generateRedditSubmitUrl = module.generateRedditSubmitUrl;
  generateShareUrl = module.generateShareUrl;
  openRedditShare = module.openRedditShare;
  trackShareClick = module.trackShareClick;

  // Mock window.open
  globalThis.window = {
    open: vi.fn()
  } as any;

  // Mock console methods
  globalThis.console = {
    log: vi.fn(),
    error: vi.fn()
  } as any;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Reddit Share Module - Story 5.2', () => {
  describe('generateRedditPost()', () => {
    it('should generate Reddit post with aligned prediction (AC: Reddit post template)', () => {
      const userDate = '2027-03-15';
      const medianDate = '2027-03-15';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit&u=abc12345';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.title).toBe('GTA 6 Launch Date Predictions - What does the community think?');
      expect(result.body).toContain('I just submitted my prediction: March 15, 2027');
      expect(result.body).toContain('Community median: March 15, 2027');
      expect(result.body).toContain("I'm aligned with the community!");
      expect(result.body).toContain(siteUrl);
      expect(result.url).toBe(siteUrl);
    });

    it('should generate Reddit post with optimistic prediction (AC: Personalization logic)', () => {
      const userDate = '2027-01-15'; // 60 days before median
      const medianDate = '2027-03-15';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.title).toBe('GTA 6 Launch Date Predictions - What does the community think?');
      expect(result.body).toContain('I just submitted my prediction: January 15, 2027');
      expect(result.body).toContain('Community median: March 15, 2027');
      expect(result.body).toContain("I'm 59 days more optimistic compared to everyone else!");
      expect(result.url).toBe(siteUrl);
    });

    it('should generate Reddit post with pessimistic prediction (AC: Personalization logic)', () => {
      const userDate = '2027-06-15'; // 92 days after median
      const medianDate = '2027-03-15';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.title).toBe('GTA 6 Launch Date Predictions - What does the community think?');
      expect(result.body).toContain('I just submitted my prediction: June 15, 2027');
      expect(result.body).toContain('Community median: March 15, 2027');
      expect(result.body).toContain("I'm 92 days more pessimistic compared to everyone else!");
      expect(result.url).toBe(siteUrl);
    });

    it('should handle missing dates gracefully (AC: Error handling)', () => {
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(null as any, null as any, siteUrl);

      expect(result.title).toBe('GTA 6 Launch Date Predictions - What does the community think?');
      expect(result.body).toContain('Check out the full data and add your prediction');
      expect(result.body).toContain(siteUrl);
      expect(result.url).toBe(siteUrl);
    });

    it('should format dates consistently (AC: Date formatting)', () => {
      const userDate = '2027-12-25'; // December 25, 2027
      const medianDate = '2027-06-15'; // June 15, 2027
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.body).toContain('December 25, 2027');
      expect(result.body).toContain('June 15, 2027');
    });

    it('should calculate delta correctly for edge case: 1 day difference', () => {
      const userDate = '2027-03-16'; // 1 day after median
      const medianDate = '2027-03-15';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.body).toContain("I'm 1 days more pessimistic");
    });
  });

  describe('generateRedditSubmitUrl()', () => {
    it('should generate Reddit submit URL with correct parameters (AC: Reddit Submit API)', () => {
      const title = 'GTA 6 Launch Date Predictions - What does the community think?';
      const postUrl = 'https://gta6predictions.com/?ref=reddit&u=abc12345';

      const submitUrl = generateRedditSubmitUrl(title, postUrl);

      expect(submitUrl).toContain('https://reddit.com/submit?');
      expect(submitUrl).toContain('url=https%3A%2F%2Fgta6predictions.com%2F%3Fref%3Dreddit%26u%3Dabc12345');
      // URLSearchParams uses + for spaces which is valid URL encoding
      expect(submitUrl).toContain('title=GTA+6+Launch+Date+Predictions');
      expect(submitUrl).toContain('resubmit=true');
    });

    it('should properly URL-encode special characters (AC: URL encoding correctness)', () => {
      const title = 'Test Title with Spaces & Special Characters!';
      const postUrl = 'https://example.com/?param=value&other=123';

      const submitUrl = generateRedditSubmitUrl(title, postUrl);

      expect(submitUrl).toContain('url=https%3A%2F%2Fexample.com%2F%3Fparam%3Dvalue%26other%3D123');
      // URLSearchParams uses + for spaces and properly encodes special characters
      expect(submitUrl).toContain('title=Test+Title+with+Spaces+%26+Special+Characters');
    });

    it('should include resubmit parameter for same URL submission (AC: Reddit API)', () => {
      const title = 'Test Title';
      const postUrl = 'https://gta6predictions.com/';

      const submitUrl = generateRedditSubmitUrl(title, postUrl);

      expect(submitUrl).toContain('resubmit=true');
    });
  });

  describe('generateShareUrl()', () => {
    it('should generate share URL with ref=reddit parameter (AC: URL tracking parameters)', () => {
      const shareUrl = generateShareUrl();

      expect(shareUrl).toBe('https://gta6predictions.com/?ref=reddit');
    });

    it('should include u parameter when cookie ID provided (AC: Privacy-preserving tracking)', () => {
      const cookieId = 'abcdefgh-1234-5678-90ab-cdef12345678';

      const shareUrl = generateShareUrl(cookieId);

      expect(shareUrl).toBe('https://gta6predictions.com/?ref=reddit&u=abcdefgh');
    });

    it('should use first 8 chars of cookie ID for u parameter (AC: Anonymous tracking)', () => {
      const cookieId = '12345678-abcd-efgh-ijkl-mnopqrstuvwx';

      const shareUrl = generateShareUrl(cookieId);

      expect(shareUrl).toContain('u=12345678');
      expect(shareUrl).not.toContain('abcd-efgh-ijkl');
    });

    it('should handle null cookie ID gracefully', () => {
      const shareUrl = generateShareUrl(null);

      expect(shareUrl).toBe('https://gta6predictions.com/?ref=reddit');
      expect(shareUrl).not.toContain('u=');
    });
  });

  describe('openRedditShare()', () => {
    it('should open Reddit share dialog in new window (AC: window.open)', () => {
      const userDate = '2027-03-15';
      const medianDate = '2027-03-15';
      const cookieId = 'test-cookie-id';

      const result = openRedditShare(userDate, medianDate, cookieId);

      expect(window.open).toHaveBeenCalledTimes(1);
      const callArgs = (window.open as any).mock.calls[0];
      expect(callArgs[0]).toContain('https://reddit.com/submit?');
      expect(callArgs[1]).toBe('reddit-share');
      expect(callArgs[2]).toBe('width=800,height=600,scrollbars=yes,resizable=yes');
      expect(result).toBe(true);
    });

    it('should return true on successful share (AC: Success indicator)', () => {
      const userDate = '2027-03-15';
      const medianDate = '2027-03-15';

      const result = openRedditShare(userDate, medianDate);

      expect(result).toBe(true);
    });

    it('should return false and log error on exception (AC: Error handling)', () => {
      (window.open as any).mockImplementation(() => {
        throw new Error('window.open blocked by browser');
      });

      const userDate = '2027-03-15';
      const medianDate = '2027-03-15';

      const result = openRedditShare(userDate, medianDate);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error opening Reddit share:',
        expect.any(Error)
      );
    });

    it('should generate correct Reddit submit URL with tracking', () => {
      const userDate = '2027-06-15';
      const medianDate = '2027-03-15';
      const cookieId = 'abc12345-test-id';

      openRedditShare(userDate, medianDate, cookieId);

      const callArgs = (window.open as any).mock.calls[0];
      // URL is double-encoded: ref=reddit becomes %3Fref%3Dreddit in the URL parameter
      expect(callArgs[0]).toContain('reddit.com/submit');
      expect(callArgs[0]).toContain('ref%3Dreddit');
      expect(callArgs[0]).toContain('u%3Dabc12345');
    });
  });

  describe('trackShareClick()', () => {
    it('should track share button click with platform and dates (AC: Share analytics)', () => {
      const eventData = {
        user_prediction: '2027-03-15',
        median_prediction: '2027-03-15'
      };

      const result = trackShareClick('reddit', eventData);

      expect(console.log).toHaveBeenCalledTimes(1);
      const logCall = (console.log as any).mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.event).toBe('share_click');
      expect(logData.platform).toBe('reddit');
      expect(logData.user_prediction).toBe('2027-03-15');
      expect(logData.median_prediction).toBe('2027-03-15');
      expect(logData.delta_days).toBe(0);
      expect(logData.level).toBe('INFO');
      expect(logData.timestamp).toBeDefined();
      expect(result).toBe(true);
    });

    it('should calculate delta_days for optimistic prediction', () => {
      const eventData = {
        user_prediction: '2027-01-15',
        median_prediction: '2027-03-15'
      };

      trackShareClick('reddit', eventData);

      const logCall = (console.log as any).mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.delta_days).toBe(-59);
    });

    it('should calculate delta_days for pessimistic prediction', () => {
      const eventData = {
        user_prediction: '2027-06-15',
        median_prediction: '2027-03-15'
      };

      trackShareClick('reddit', eventData);

      const logCall = (console.log as any).mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.delta_days).toBe(92);
    });

    it('should handle missing user_prediction gracefully', () => {
      const eventData = {
        median_prediction: '2027-03-15'
      };

      const result = trackShareClick('reddit', eventData);

      const logCall = (console.log as any).mock.calls[0][0];
      const logData = JSON.parse(logCall);

      expect(logData.user_prediction).toBe(null);
      expect(logData.delta_days).toBe(null);
      expect(result).toBe(true);
    });

    it('should return false and log error on exception (AC: Non-blocking analytics)', () => {
      (console.log as any).mockImplementation(() => {
        throw new Error('Logging error');
      });

      const eventData = {
        user_prediction: '2027-03-15',
        median_prediction: '2027-03-15'
      };

      const result = trackShareClick('reddit', eventData);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error tracking share click:',
        expect.any(Error)
      );
    });

    it('should support both twitter and reddit platforms', () => {
      const eventData = {
        user_prediction: '2027-03-15',
        median_prediction: '2027-03-15'
      };

      trackShareClick('reddit', eventData);
      trackShareClick('twitter', eventData);

      expect(console.log).toHaveBeenCalledTimes(2);

      const redditLog = JSON.parse((console.log as any).mock.calls[0][0]);
      const twitterLog = JSON.parse((console.log as any).mock.calls[1][0]);

      expect(redditLog.platform).toBe('reddit');
      expect(twitterLog.platform).toBe('twitter');
    });
  });

  describe('Integration Tests - Full Share Flow', () => {
    it('should complete full Reddit share flow successfully', () => {
      const userDate = '2027-06-15';
      const medianDate = '2027-03-15';
      const cookieId = 'integration-test-id';

      // Step 1: Generate Reddit post
      const redditPost = generateRedditPost(userDate, medianDate, 'https://gta6predictions.com/?ref=reddit&u=integrati');

      // Verify post generation
      expect(redditPost.title).toBeTruthy();
      expect(redditPost.body).toContain('June 15, 2027');
      expect(redditPost.body).toContain('March 15, 2027');
      expect(redditPost.body).toContain('92 days more pessimistic');

      // Step 2: Generate share URL
      const shareUrl = generateShareUrl(cookieId);
      expect(shareUrl).toContain('ref=reddit');
      expect(shareUrl).toContain('u=integrat'); // First 8 chars of cookie ID

      // Step 3: Generate Reddit submit URL
      const submitUrl = generateRedditSubmitUrl(redditPost.title, shareUrl);
      expect(submitUrl).toContain('reddit.com/submit');
      expect(submitUrl).toContain('resubmit=true');

      // Step 4: Track share click
      const trackingResult = trackShareClick('reddit', {
        user_prediction: userDate,
        median_prediction: medianDate
      });
      expect(trackingResult).toBe(true);

      // Step 5: Open share dialog
      const shareResult = openRedditShare(userDate, medianDate, cookieId);
      expect(shareResult).toBe(true);
      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle leap year dates correctly', () => {
      const userDate = '2028-02-29'; // Leap year
      const medianDate = '2027-02-28';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.body).toContain('February 29, 2028');
      expect(result.body).toContain('February 28, 2027');
      expect(result.body).toContain('366 days more pessimistic');
    });

    it('should handle year boundary crossing', () => {
      const userDate = '2028-01-01';
      const medianDate = '2027-12-31';
      const siteUrl = 'https://gta6predictions.com/?ref=reddit';

      const result = generateRedditPost(userDate, medianDate, siteUrl);

      expect(result.body).toContain('January 1, 2028');
      expect(result.body).toContain('December 31, 2027');
      expect(result.body).toContain('1 days more pessimistic');
    });

    it('should handle extremely long cookie IDs', () => {
      const longCookieId = 'a'.repeat(100);

      const shareUrl = generateShareUrl(longCookieId);

      expect(shareUrl).toContain('u=aaaaaaaa'); // Only first 8 chars
      expect(shareUrl.length).toBeLessThan(100); // Reasonable length
    });
  });
});
