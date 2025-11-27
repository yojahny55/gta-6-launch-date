// Story 5.5: Mobile-Responsive Design - Utilities
// FR87 (Touch targets), FR93 (Mobile testing), FR40 (Performance)

/**
 * Detect if device is mobile based on viewport width and user agent
 * @returns {boolean} True if mobile device detected
 */
export function isMobileDevice() {
  // Check viewport width (< 768px is mobile)
  const isMobileViewport = window.innerWidth < 768;

  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

  return isMobileViewport || isMobileUA;
}

/**
 * Detect if device supports native date picker
 * @returns {boolean} True if native date picker supported
 */
export function supportsNativeDatePicker() {
  const input = document.createElement('input');
  input.setAttribute('type', 'date');

  // Check if type is still 'date' (not downgraded to 'text')
  return input.type === 'date';
}

/**
 * Initialize native mobile date picker for mobile devices
 * AC: Use HTML5 <input type="date"> on mobile (Story 5.5 Task 9)
 */
export function initMobileDatePicker() {
  const dateInput = document.getElementById('predicted-date');

  if (!dateInput) {
    console.warn('Date input not found');
    return;
  }

  const isMobile = isMobileDevice();
  const supportsNative = supportsNativeDatePicker();

  if (isMobile && supportsNative) {
    // Mobile device with native picker support - use native input
    console.log('Mobile device detected - using native date picker');

    // Ensure input type is 'date' (should already be set in HTML)
    dateInput.type = 'date';

    // Add mobile-specific styling
    dateInput.classList.add('mobile-date-picker');

    // Ensure touch-friendly sizing (44x44px minimum - FR87)
    dateInput.style.minHeight = '44px';
    dateInput.style.fontSize = '16px'; // Prevents iOS zoom on focus
  } else if (!isMobile && supportsNative) {
    // Desktop with native picker support - use native input
    console.log('Desktop device detected - using native date picker');
    dateInput.type = 'date';
  } else {
    // Fallback for browsers without native date picker
    console.log('Native date picker not supported - using fallback');
    dateInput.type = 'text';
    dateInput.placeholder = 'YYYY-MM-DD';

    // Add pattern validation for fallback
    dateInput.pattern = '\\d{4}-\\d{2}-\\d{2}';
  }
}

/**
 * Initialize lazy loading for images
 * AC: Lazy load images below the fold (Story 5.5 Task 6)
 */
export function initLazyLoading() {
  // Check if native lazy loading is supported
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported - add loading="lazy" to images
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });

    console.log(`Native lazy loading enabled for ${images.length} images`);
  } else {
    // Fallback: Use Intersection Observer for older browsers
    const images = document.querySelectorAll('img[data-src]');

    if (images.length === 0) return;

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }

          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before entering viewport
    });

    images.forEach(img => imageObserver.observe(img));

    console.log(`Intersection Observer lazy loading enabled for ${images.length} images`);
  }
}

/**
 * Check if viewport is at a specific breakpoint
 * Tailwind breakpoints: sm=640px, md=768px, lg=1024px
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

/**
 * Get current breakpoint name
 * @returns {string} Current breakpoint (mobile, tablet, desktop)
 */
export function getCurrentBreakpoint() {
  const width = window.innerWidth;

  if (width < breakpoints.md) {
    return 'mobile'; // < 768px
  } else if (width < breakpoints.lg) {
    return 'tablet'; // 768px - 1023px
  } else {
    return 'desktop'; // >= 1024px
  }
}

/**
 * Validate touch target sizes (minimum 44x44px - FR87, WCAG 2.1 Level AAA)
 * @returns {Array} List of elements with touch targets < 44px
 */
export function validateTouchTargets() {
  const tappableSelectors = 'button, a, input[type="submit"], input[type="button"], .btn';
  const tappableElements = document.querySelectorAll(tappableSelectors);
  const invalidTargets = [];

  tappableElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width < 44 || height < 44) {
      invalidTargets.push({
        element: el,
        width: Math.round(width),
        height: Math.round(height),
        selector: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : '')
      });
    }
  });

  if (invalidTargets.length > 0) {
    console.warn(`Found ${invalidTargets.length} touch targets smaller than 44x44px:`, invalidTargets);
  } else {
    console.log('✓ All touch targets meet 44x44px minimum size (FR87)');
  }

  return invalidTargets;
}

/**
 * Test for horizontal overflow (mobile usability issue)
 * @returns {boolean} True if horizontal overflow detected
 */
export function detectHorizontalOverflow() {
  const bodyWidth = document.body.scrollWidth;
  const windowWidth = window.innerWidth;

  const hasOverflow = bodyWidth > windowWidth;

  if (hasOverflow) {
    console.warn(`Horizontal overflow detected: body=${bodyWidth}px, window=${windowWidth}px`);
  } else {
    console.log('✓ No horizontal overflow detected');
  }

  return hasOverflow;
}

/**
 * Initialize all responsive utilities on page load
 */
export function initResponsiveUtils() {
  console.log('Initializing responsive utilities...');

  // Detect device type
  const breakpoint = getCurrentBreakpoint();
  console.log(`Current breakpoint: ${breakpoint} (${window.innerWidth}px)`);

  // Initialize mobile date picker
  initMobileDatePicker();

  // Initialize lazy loading
  initLazyLoading();

  // Validate touch targets (development mode only)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    validateTouchTargets();
    detectHorizontalOverflow();
  }

  console.log('✓ Responsive utilities initialized');
}

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResponsiveUtils);
} else {
  // DOM already loaded
  initResponsiveUtils();
}
