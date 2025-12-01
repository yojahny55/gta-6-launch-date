/**
 * Twitter Share Module Tests (Story 5.1)
 *
 * Test coverage for Twitter/X share button functionality:
 * - Tweet text generation with personalization
 * - URL tracking parameters
 * - Twitter Web Intent URL generation
 * - Share button click tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateTweetText,
  generateTwitterIntentUrl,
  generateShareUrl,
  openTwitterShare,
  trackShareClick
} from '../../public/js/twitter-share.js';

describe('Twitter Share - Tweet Text Generation', () => {
  const baseUrl = 'https://gta6predictions.com/?ref=twitter';

  it('should generate tweet text with aligned personalization (user == median)', () => {
    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';

    const tweetText = generateTweetText(userDate, medianDate, baseUrl);

    expect(tweetText).toContain('I predicted GTA 6 will launch on March 15, 2027');
    expect(tweetText).toContain('The community median is March 15, 2027');
    expect(tweetText).toContain("I'm aligned with the community! 🎯");
    expect(tweetText).toContain('What do you think? 🎮');
    expect(tweetText).toContain(baseUrl);
  });

  it('should generate tweet text with optimistic personalization (user < median)', () => {
    const userDate = '2027-01-15'; // Earlier than median
    const medianDate = '2027-03-15';

    const tweetText = generateTweetText(userDate, medianDate, baseUrl);

    expect(tweetText).toContain('I predicted GTA 6 will launch on January 15, 2027');
    expect(tweetText).toContain('The community median is March 15, 2027');
    expect(tweetText).toContain("I'm 59 days more optimistic 🤞"); // 59 days earlier
    expect(tweetText).toContain('What do you think? 🎮');
    expect(tweetText).toContain(baseUrl);
  });

  it('should generate tweet text with pessimistic personalization (user > median)', () => {
    const userDate = '2027-06-15'; // Later than median
    const medianDate = '2027-03-15';

    const tweetText = generateTweetText(userDate, medianDate, baseUrl);

    expect(tweetText).toContain('I predicted GTA 6 will launch on June 15, 2027');
    expect(tweetText).toContain('The community median is March 15, 2027');
    expect(tweetText).toContain("I'm 92 days more pessimistic 😬"); // 92 days later
    expect(tweetText).toContain('What do you think? 🎮');
    expect(tweetText).toContain(baseUrl);
  });

  it('should handle missing dates with fallback text', () => {
    const tweetText = generateTweetText('', '', baseUrl);

    expect(tweetText).toContain('Check out GTA 6 launch date predictions! 🎮');
    expect(tweetText).toContain(baseUrl);
  });

  it('should handle null dates with fallback text', () => {
    const tweetText = generateTweetText(null as any, null as any, baseUrl);

    expect(tweetText).toContain('Check out GTA 6 launch date predictions! 🎮');
    expect(tweetText).toContain(baseUrl);
  });

  it('should format dates correctly for display', () => {
    const userDate = '2027-02-14'; // Valentine's Day
    const medianDate = '2027-12-25'; // Christmas

    const tweetText = generateTweetText(userDate, medianDate, baseUrl);

    expect(tweetText).toContain('February 14, 2027');
    expect(tweetText).toContain('December 25, 2027');
  });

  it('should calculate correct days difference for edge cases', () => {
    // Test 1 day difference
    const userDate1 = '2027-03-16';
    const medianDate1 = '2027-03-15';
    const tweet1 = generateTweetText(userDate1, medianDate1, baseUrl);
    expect(tweet1).toContain("I'm 1 days more pessimistic 😬");

    // Test large difference (366 days due to leap year 2028)
    const userDate2 = '2028-03-15';
    const medianDate2 = '2027-03-15';
    const tweet2 = generateTweetText(userDate2, medianDate2, baseUrl);
    expect(tweet2).toContain("I'm 366 days more pessimistic 😬"); // 2028 is a leap year
  });
});

describe('Twitter Share - Twitter Web Intent URL Generation', () => {
  it('should generate correct Twitter Web Intent URL with encoded text', () => {
    const tweetText = 'I predicted GTA 6 will launch on March 15, 2027. What do you think? 🎮';
    const url = generateTwitterIntentUrl(tweetText);

    expect(url).toContain('https://twitter.com/intent/tweet?');
    expect(url).toContain('text='); // Text parameter should be present
    expect(url).toContain('hashtags=GTA6%2CRockstar'); // Default hashtags URL-encoded
  });

  it('should URL-encode special characters in tweet text', () => {
    const tweetText = 'Test with special chars: & = ? # @';
    const url = generateTwitterIntentUrl(tweetText);

    // URLSearchParams encodes spaces as + (which is valid and equivalent to %20)
    expect(url).toContain('text=Test+with+special+chars'); // Spaces encoded as +
    // Note: & and = are used in URL params, so they will exist in the URL structure
    expect(url).toContain('%26'); // & encoded as %26
    expect(url).toContain('%3D'); // = encoded as %3D
  });

  it('should include custom hashtags when provided', () => {
    const tweetText = 'Test tweet';
    const customHashtags = 'Gaming,RockstarGames';
    const url = generateTwitterIntentUrl(tweetText, customHashtags);

    expect(url).toContain('hashtags=Gaming%2CRockstarGames');
  });

  it('should use default hashtags if none provided', () => {
    const tweetText = 'Test tweet';
    const url = generateTwitterIntentUrl(tweetText);

    expect(url).toContain('hashtags=GTA6%2CRockstar');
  });
});

describe('Twitter Share - Share URL with Tracking Parameters', () => {
  it('should generate share URL with ref=twitter parameter', () => {
    const url = generateShareUrl();

    expect(url).toBe('https://gta6predictions.com/?ref=twitter');
  });

  it('should include u parameter when cookie ID provided', () => {
    const cookieId = '550e8400-e29b-41d4-a716-446655440000'; // UUID v4
    const url = generateShareUrl(cookieId);

    expect(url).toContain('ref=twitter');
    expect(url).toContain('u=550e8400'); // First 8 chars of cookie ID
    expect(url).toBe('https://gta6predictions.com/?ref=twitter&u=550e8400');
  });

  it('should handle null cookie ID gracefully', () => {
    const url = generateShareUrl(null);

    expect(url).toBe('https://gta6predictions.com/?ref=twitter');
    expect(url).not.toContain('u=');
  });

  it('should handle undefined cookie ID gracefully', () => {
    const url = generateShareUrl(undefined);

    expect(url).toBe('https://gta6predictions.com/?ref=twitter');
    expect(url).not.toContain('u=');
  });

  it('should truncate cookie ID to 8 characters for u parameter', () => {
    const cookieId = 'abcdef12-3456-7890-abcd-ef1234567890';
    const url = generateShareUrl(cookieId);

    expect(url).toContain('u=abcdef12');
    expect(url).not.toContain('u=abcdef12-3456'); // Should not include full UUID
  });
});

describe('Twitter Share - Open Twitter Share Dialog', () => {
  let windowOpenSpy: any;

  beforeEach(() => {
    // Mock window.open
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('should call window.open with correct URL and window features', () => {
    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';
    const cookieId = '550e8400-e29b-41d4-a716-446655440000';

    const result = openTwitterShare(userDate, medianDate, cookieId);

    expect(windowOpenSpy).toHaveBeenCalled();
    const [url, windowName, windowFeatures] = windowOpenSpy.mock.calls[0];

    // Verify URL contains Twitter Web Intent
    expect(url).toContain('https://twitter.com/intent/tweet');

    // Verify window name and features
    expect(windowName).toBe('twitter-share');
    expect(windowFeatures).toContain('width=550');
    expect(windowFeatures).toContain('height=420');
    expect(windowFeatures).toContain('scrollbars=yes');
    expect(windowFeatures).toContain('resizable=yes');

    expect(result).toBe(true);
  });

  it('should return true on successful window.open call', () => {
    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';

    const result = openTwitterShare(userDate, medianDate);

    expect(result).toBe(true);
  });

  it('should handle window.open failure gracefully', () => {
    windowOpenSpy.mockImplementation(() => {
      throw new Error('Window blocked by popup blocker');
    });

    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';

    const result = openTwitterShare(userDate, medianDate);

    expect(result).toBe(false);
  });

  it('should include tracking URL in tweet text', () => {
    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';
    const cookieId = '550e8400-e29b-41d4-a716-446655440000';

    openTwitterShare(userDate, medianDate, cookieId);

    const [url] = windowOpenSpy.mock.calls[0];

    // URL should contain encoded share URL with tracking params
    expect(url).toContain('gta6predictions.com');
    expect(url).toContain('ref%3Dtwitter'); // URL-encoded ?ref=twitter
  });
});

describe('Twitter Share - Click Tracking', () => {
  it('should return true for successful tracking', () => {
    const eventData = {
      user_prediction: '2027-03-15',
      median_prediction: '2027-03-15'
    };

    const result = trackShareClick('twitter', eventData);

    // Function should return true on success (no console logging in production)
    expect(result).toBe(true);
  });

  it('should calculate delta_days for optimistic prediction', () => {
    const eventData = {
      user_prediction: '2027-01-15', // 59 days earlier
      median_prediction: '2027-03-15'
    };

    const result = trackShareClick('twitter', eventData);

    // Function should complete successfully
    expect(result).toBe(true);
  });

  it('should calculate delta_days for pessimistic prediction', () => {
    const eventData = {
      user_prediction: '2027-06-15', // 92 days later
      median_prediction: '2027-03-15'
    };

    const result = trackShareClick('twitter', eventData);

    // Function should complete successfully
    expect(result).toBe(true);
  });

  it('should handle missing user_prediction gracefully', () => {
    const eventData = {
      median_prediction: '2027-03-15'
    };

    const result = trackShareClick('twitter', eventData);

    // Should handle missing data gracefully
    expect(result).toBe(true);
  });

  it('should be non-blocking on error (analytics failure)', () => {
    // Mock console.error to throw (simulating catastrophic failure)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('Console unavailable');
    });

    const eventData = {
      user_prediction: '2027-03-15',
      median_prediction: '2027-03-15'
    };

    // Should not throw - analytics is non-blocking
    const result = trackShareClick('twitter', eventData);

    // Should return true even if logging fails (non-blocking)
    expect(result).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  it('should track reddit platform correctly', () => {
    const eventData = {
      median_prediction: '2027-03-15'
    };

    const result = trackShareClick('reddit', eventData);

    // Function should complete successfully
    expect(result).toBe(true);
  });
});

describe('Twitter Share - Integration Tests', () => {
  let windowOpenSpy: any;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('should generate complete share flow with personalized tweet', () => {
    const userDate = '2027-06-15';
    const medianDate = '2027-03-15';
    const cookieId = '550e8400-e29b-41d4-a716-446655440000';

    // Track click (no console logging in production)
    const trackResult = trackShareClick('twitter', {
      user_prediction: userDate,
      median_prediction: medianDate
    });

    // Verify tracking returned success
    expect(trackResult).toBe(true);

    // Open share
    openTwitterShare(userDate, medianDate, cookieId);

    // Verify window opened
    expect(windowOpenSpy).toHaveBeenCalled();
    const [url] = windowOpenSpy.mock.calls[0];

    // Verify URL contains personalized message
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain('June+15'); // URL-encoded date (+ is space encoding)
    expect(url).toContain('March+15'); // URL-encoded date
    expect(url).toContain('pessimistic'); // Personalization
    expect(url).toContain('ref%3Dtwitter'); // Tracking parameter
  });

  it('should respect 280 character limit for tweet text (with URL shortening)', () => {
    // Twitter shortens all URLs to 23 characters (t.co links)
    const userDate = '2027-03-15';
    const medianDate = '2027-03-15';
    const shareUrl = generateShareUrl('550e8400-e29b-41d4-a716-446655440000');

    const tweetText = generateTweetText(userDate, medianDate, shareUrl);

    // Calculate length with t.co shortening assumption
    const tcoLength = 23; // Twitter's URL shortening length
    const textWithoutUrl = tweetText.replace(shareUrl, '');
    const totalLength = textWithoutUrl.length + tcoLength;

    expect(totalLength).toBeLessThanOrEqual(280);
  });
});
