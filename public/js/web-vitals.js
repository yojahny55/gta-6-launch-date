/**
 * Core Web Vitals Monitoring (Story 5.6: FR102)
 *
 * Tracks Largest Contentful Paint (LCP), First Input Delay (FID),
 * and Cumulative Layout Shift (CLS) using the native Performance API.
 *
 * Sends data to Cloudflare Web Analytics (automatically tracked) or logs
 * to console for debugging.
 *
 * Targets (p75):
 * - LCP < 2.5s (good), 2.5-4s (needs improvement), >4s (poor)
 * - FID < 100ms (good), 100-300ms (needs improvement), >300ms (poor)
 * - CLS < 0.1 (good), 0.1-0.25 (needs improvement), >0.25 (poor)
 *
 * @see https://web.dev/vitals/
 */

(function() {
  'use strict';

  // Core Web Vitals data
  const vitalsData = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null, // First Contentful Paint (bonus metric)
    ttfb: null, // Time to First Byte (bonus metric)
  };

  /**
   * Track Largest Contentful Paint (LCP)
   * LCP measures loading performance. Good LCP is < 2.5s.
   */
  function trackLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitalsData.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);

        // Log LCP
        console.log(`[Web Vitals] LCP: ${vitalsData.lcp}ms`, {
          status: vitalsData.lcp < 2500 ? 'GOOD' : vitalsData.lcp < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR',
          element: lastEntry.element,
        });

        // Send to analytics (Cloudflare Web Analytics automatically tracks LCP)
        sendToAnalytics('lcp', vitalsData.lcp);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.error('[Web Vitals] LCP tracking failed:', error);
    }
  }

  /**
   * Track First Input Delay (FID)
   * FID measures interactivity. Good FID is < 100ms.
   */
  function trackFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        vitalsData.fid = Math.round(firstInput.processingStart - firstInput.startTime);

        // Log FID
        console.log(`[Web Vitals] FID: ${vitalsData.fid}ms`, {
          status: vitalsData.fid < 100 ? 'GOOD' : vitalsData.fid < 300 ? 'NEEDS_IMPROVEMENT' : 'POOR',
          eventType: firstInput.name,
        });

        // Send to analytics
        sendToAnalytics('fid', vitalsData.fid);
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.error('[Web Vitals] FID tracking failed:', error);
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   * CLS measures visual stability. Good CLS is < 0.1.
   */
  function trackCLS() {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent user input
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session, add
            // it to the current session. Otherwise, start a new session.
            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            // Update the max session value if the current session is larger
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              vitalsData.cls = Math.round(clsValue * 1000) / 1000; // Round to 3 decimals

              // Log CLS
              console.log(`[Web Vitals] CLS: ${vitalsData.cls}`, {
                status: vitalsData.cls < 0.1 ? 'GOOD' : vitalsData.cls < 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR',
              });
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Send final CLS to analytics when page visibility changes (user leaves)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && vitalsData.cls !== null) {
          sendToAnalytics('cls', vitalsData.cls);
        }
      });
    } catch (error) {
      console.error('[Web Vitals] CLS tracking failed:', error);
    }
  }

  /**
   * Track First Contentful Paint (FCP) - Bonus metric
   * FCP measures perceived load speed. Good FCP is < 1.8s.
   */
  function trackFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitalsData.fcp = Math.round(fcpEntry.startTime);
          console.log(`[Web Vitals] FCP: ${vitalsData.fcp}ms`, {
            status: vitalsData.fcp < 1800 ? 'GOOD' : vitalsData.fcp < 3000 ? 'NEEDS_IMPROVEMENT' : 'POOR',
          });
          sendToAnalytics('fcp', vitalsData.fcp);
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.error('[Web Vitals] FCP tracking failed:', error);
    }
  }

  /**
   * Track Time to First Byte (TTFB) - Bonus metric
   * TTFB measures server response time. Good TTFB is < 800ms.
   */
  function trackTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        vitalsData.ttfb = Math.round(navigationEntry.responseStart - navigationEntry.requestStart);
        console.log(`[Web Vitals] TTFB: ${vitalsData.ttfb}ms`, {
          status: vitalsData.ttfb < 800 ? 'GOOD' : vitalsData.ttfb < 1800 ? 'NEEDS_IMPROVEMENT' : 'POOR',
        });
        sendToAnalytics('ttfb', vitalsData.ttfb);
      }
    } catch (error) {
      console.error('[Web Vitals] TTFB tracking failed:', error);
    }
  }

  /**
   * Send metrics to analytics
   * @param {string} metric - Metric name (lcp, fid, cls, etc.)
   * @param {number} value - Metric value
   */
  function sendToAnalytics(metric, value) {
    // Cloudflare Web Analytics automatically tracks Core Web Vitals
    // This function is for custom event tracking or debugging

    // Log to console for debugging (removed in production via Vite minification)
    console.log(`[Web Vitals] Sending ${metric.toUpperCase()} to analytics:`, value);

    // Optional: Send to custom analytics endpoint
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ metric, value, timestamp: Date.now() }),
    //   keepalive: true, // Ensure request completes even if user navigates away
    // }).catch((error) => {
    //   console.error('[Web Vitals] Failed to send analytics:', error);
    // });
  }

  /**
   * Get all Core Web Vitals data (for testing/debugging)
   * @returns {object} All tracked vitals
   */
  function getVitals() {
    return vitalsData;
  }

  /**
   * Initialize Web Vitals tracking
   */
  function init() {
    // Check if Performance Observer is supported
    if (!('PerformanceObserver' in window)) {
      console.warn('[Web Vitals] Performance Observer API not supported');
      return;
    }

    // Track all Core Web Vitals
    trackLCP();
    trackFID();
    trackCLS();

    // Track bonus metrics
    trackFCP();
    trackTTFB();

    console.log('[Web Vitals] Monitoring initialized');
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose getVitals for debugging
  window.getWebVitals = getVitals;
})();
