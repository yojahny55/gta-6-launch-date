/**
 * About Page Tests
 * Story 4.4: About Page (Transparency & Methodology)
 *
 * Tests about page structure, content sections, algorithm transparency,
 * privacy information, and navigation requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('About Page - Story 4.4', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Load the actual about.html file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../public/about.html'),
      'utf-8'
    );
    dom = new JSDOM(html, {
      url: 'http://localhost/about.html',
      runScripts: 'dangerously',
      resources: 'usable',
    });
    document = dom.window.document;
    window = dom.window as unknown as Window;
  });

  describe('AC1: Page Structure and Metadata', () => {
    it('should have correct page title', () => {
      const title = document.querySelector('title');
      expect(title?.textContent).toContain('About');
      expect(title?.textContent).toContain('GTA 6');
    });

    it('should have transparency-focused meta description', () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toContain('community');
      expect(metaDescription?.getAttribute('content')).toContain('transparency');
    });

    it('should have main heading "About GTA 6 Predictions"', () => {
      const h1 = document.querySelector('h1');
      expect(h1?.textContent).toContain('About');
      expect(h1?.textContent).toContain('GTA 6');
    });

    it('should have smooth scroll CSS applied', () => {
      const style = document.querySelector('style');
      expect(style?.textContent).toContain('scroll-behavior');
      expect(style?.textContent).toContain('smooth');
    });
  });

  describe('AC2: Section 1 - What Is This?', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#what-is-this');
    });

    it('should have "What Is This?" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('What Is This');
    });

    it('should describe community-driven prediction tracker', () => {
      const text = section?.textContent || '';
      expect(text).toContain('community-driven');
      expect(text).toContain('tracker');
    });

    it('should emphasize real community sentiment', () => {
      const text = section?.textContent || '';
      expect(text).toContain('community');
      expect(text.toLowerCase()).toContain('sentiment');
    });

    it('should highlight anonymous participation', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('anonymous');
    });
  });

  describe('AC3: Section 2 - Why This Exists', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#why-this-exists');
    });

    it('should have "Why This Exists" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('Why This Exists');
    });

    it('should explain Rockstar delay and community skepticism', () => {
      const text = section?.textContent || '';
      expect(text).toContain('delay');
      expect(text.toLowerCase()).toContain('skeptic');
    });

    it('should identify gap in existing tools', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('gap');
    });

    it('should justify need for sentiment tracker', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('sentiment');
    });
  });

  describe('AC4: Section 3 - How It Works', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#how-it-works');
    });

    it('should have "How It Works" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('How It Works');
    });

    it('should explain anonymous submission process', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('anonymous');
      expect(text.toLowerCase()).toContain('submit');
    });

    it('should describe weighted median calculation', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('weighted median');
    });

    it('should explain community consensus display', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('consensus');
    });

    it('should promote sharing functionality', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('share');
    });
  });

  describe('AC5: Section 4 - The Algorithm (Transparency)', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#the-algorithm');
    });

    it('should have "The Algorithm" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('Algorithm');
    });

    it('should explain weighted median concept', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('weighted median');
    });

    it('should list all three weight tiers (1.0, 0.3, 0.1)', () => {
      const text = section?.textContent || '';
      expect(text).toContain('1.0');
      expect(text).toContain('0.3');
      expect(text).toContain('0.1');
    });

    it('should have weight tiers table', () => {
      const table = section?.querySelector('table');
      expect(table).toBeTruthy();
      expect(table?.querySelectorAll('tbody tr').length).toBe(3);
    });

    it('should explain full weight for reasonable predictions (within 5 years)', () => {
      const text = section?.textContent || '';
      expect(text).toContain('5 years');
      expect(text).toContain('1.0');
    });

    it('should explain reduced weight for far predictions (5-50 years)', () => {
      const text = section?.textContent || '';
      expect(text).toContain('5-50');
      expect(text).toContain('0.3');
    });

    it('should explain minimal weight for extreme predictions (50+ years)', () => {
      const text = section?.textContent || '';
      expect(text).toContain('50');
      expect(text).toContain('0.1');
    });

    it('should justify troll mitigation', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('troll');
    });

    it('should use plain language for technical concept', () => {
      const text = section?.textContent || '';
      expect(text).toContain('Plain English');
    });
  });

  describe('AC6: Section 5 - Privacy & Data', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#privacy-and-data');
    });

    it('should have "Privacy & Data" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('Privacy');
    });

    it('should emphasize privacy commitment', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('privacy');
      expect(text.toLowerCase()).toContain('seriously');
    });

    it('should explain IP hashing', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('hash');
      expect(text.toLowerCase()).toContain('ip');
    });

    it('should clarify cookie usage', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('cookie');
    });

    it('should link to Privacy Policy', () => {
      const link = section?.querySelector('a[href="/privacy.html"]');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Privacy Policy');
    });

    it('should list what data is collected', () => {
      const text = section?.textContent || '';
      expect(text).toContain('What We Collect');
      expect(text.toLowerCase()).toContain('prediction date');
      expect(text.toLowerCase()).toContain('cookie');
    });

    it('should list what data is NOT collected', () => {
      const text = section?.textContent || '';
      expect(text).toContain('What We DON\'T Collect');
      expect(text.toLowerCase()).toContain('no email');
      expect(text.toLowerCase()).toContain('no tracking');
    });
  });

  describe('AC7: Section 6 - Who Made This', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#who-made-this');
    });

    it('should have "Who Made This" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('Who Made This');
    });

    it('should introduce creator with personal touch', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('fan');
    });

    it('should emphasize fan-made nature', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('fan');
      expect(text.toLowerCase()).toContain('passion');
    });

    it('should provide contact email', () => {
      const email = section?.querySelector('a[href^="mailto:"]');
      expect(email).toBeTruthy();
      expect(email?.getAttribute('href')).toContain('@');
    });
  });

  describe('AC8: Section 7 - Open Source / Transparency', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#open-source');
    });

    it('should have "Open Source / Transparency" section with heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2');
      expect(heading?.textContent).toContain('Open Source');
    });

    it('should mention open-source consideration', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('open');
      expect(text.toLowerCase()).toContain('source');
    });

    it('should reference GitHub', () => {
      const text = section?.textContent || '';
      expect(text).toContain('GitHub');
    });

    it('should emphasize transparency', () => {
      const text = section?.textContent || '';
      expect(text.toLowerCase()).toContain('transparen');
    });
  });

  describe('AC9: Tone and Formatting', () => {
    it('should use conversational, friendly tone (no corporate jargon)', () => {
      const bodyText = document.body.textContent || '';
      // Check for conversational markers
      expect(bodyText.toLowerCase()).toContain('let\'s be honest');
      expect(bodyText.toLowerCase()).toContain('you');

      // Should NOT have excessive corporate jargon
      expect(bodyText.toLowerCase()).not.toContain('synergy');
      expect(bodyText.toLowerCase()).not.toContain('leverage');
    });

    it('should be honest about limitations', () => {
      const bodyText = document.body.textContent || '';
      expect(bodyText.toLowerCase()).toContain('troll');
      expect(bodyText.toLowerCase()).toContain('skeptic');
    });

    it('should apply Tailwind CSS classes for styling', () => {
      const html = fs.readFileSync(
        path.resolve(__dirname, '../../public/about.html'),
        'utf-8'
      );
      expect(html).toContain('class="card');
      expect(html).toContain('class="btn');
      expect(html).toContain('class="alert');
    });

    it('should be mobile-responsive with responsive classes', () => {
      const html = fs.readFileSync(
        path.resolve(__dirname, '../../public/about.html'),
        'utf-8'
      );
      expect(html).toContain('md:');
      expect(html).toContain('sm:');
    });
  });

  describe('AC10: Navigation and Footer Links', () => {
    it('should have footer navigation', () => {
      const footer = document.querySelector('footer nav');
      expect(footer).toBeTruthy();
    });

    it('should have link to Home', () => {
      const homeLink = document.querySelector('footer a[href="/"]');
      expect(homeLink).toBeTruthy();
      expect(homeLink?.textContent).toContain('Home');
    });

    it('should have link to Privacy Policy', () => {
      const privacyLink = document.querySelector('footer a[href="/privacy.html"]');
      expect(privacyLink).toBeTruthy();
      expect(privacyLink?.textContent).toContain('Privacy');
    });

    it('should have link to Terms of Service', () => {
      const termsLink = document.querySelector('footer a[href="/terms.html"]');
      expect(termsLink).toBeTruthy();
      expect(termsLink?.textContent).toContain('Terms');
    });

    it('should indicate current page (About) with aria-current', () => {
      const aboutLink = document.querySelector('footer a[href="/about.html"]');
      expect(aboutLink).toBeTruthy();
      expect(aboutLink?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('AC11: Accessibility (WCAG AA Compliance)', () => {
    it('should have valid HTML lang attribute', () => {
      const html = document.querySelector('html');
      expect(html?.getAttribute('lang')).toBe('en');
    });

    it('should have viewport meta tag for mobile responsiveness', () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport?.getAttribute('content')).toContain('width=device-width');
    });

    it('should use semantic HTML elements (header, main, section, footer)', () => {
      expect(document.querySelector('header')).toBeTruthy();
      expect(document.querySelector('main')).toBeTruthy();
      expect(document.querySelectorAll('section').length).toBeGreaterThanOrEqual(7);
      expect(document.querySelector('footer')).toBeTruthy();
    });

    it('should have proper heading hierarchy (h1 → h2 → h3)', () => {
      const h1 = document.querySelector('h1');
      expect(h1).toBeTruthy();

      const h2s = document.querySelectorAll('h2');
      expect(h2s.length).toBeGreaterThanOrEqual(7);

      const h3s = document.querySelectorAll('h3');
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should have ARIA labels for navigation', () => {
      const footerNav = document.querySelector('footer nav');
      expect(footerNav?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have ARIA attributes for cookie banner dialog', () => {
      const cookieBanner = document.querySelector('#cookie-consent-banner');
      expect(cookieBanner?.getAttribute('role')).toBe('dialog');
      expect(cookieBanner?.getAttribute('aria-labelledby')).toBeTruthy();
      expect(cookieBanner?.getAttribute('aria-describedby')).toBeTruthy();
    });
  });

  describe('AC12: Cookie Consent Banner', () => {
    it('should include cookie consent banner from Story 4.1', () => {
      const banner = document.querySelector('#cookie-consent-banner');
      expect(banner).toBeTruthy();
    });

    it('should have "Accept All" button', () => {
      const acceptButton = document.querySelector('#cookie-accept-all');
      expect(acceptButton).toBeTruthy();
      expect(acceptButton?.textContent).toContain('Accept');
    });

    it('should have "Functional Only" button', () => {
      const functionalButton = document.querySelector('#cookie-functional-only');
      expect(functionalButton).toBeTruthy();
      expect(functionalButton?.textContent).toContain('Functional');
    });

    it('should load cookie-consent.js script', () => {
      const script = document.querySelector('script[src="/js/cookie-consent.js"]');
      expect(script).toBeTruthy();
    });
  });

  describe('Testing Coverage Requirements', () => {
    it('should verify all 7 sections are present with correct IDs', () => {
      const sections = [
        'what-is-this',
        'why-this-exists',
        'how-it-works',
        'the-algorithm',
        'privacy-and-data',
        'who-made-this',
        'open-source',
      ];

      sections.forEach((id) => {
        const section = document.querySelector(`#${id}`);
        expect(section).toBeTruthy();
      });
    });

    it('should verify Privacy Policy link works (target exists)', () => {
      const link = document.querySelector('a[href="/privacy.html"]');
      expect(link).toBeTruthy();

      // Verify Privacy Policy file exists
      const privacyHtmlPath = path.resolve(__dirname, '../../public/privacy.html');
      expect(fs.existsSync(privacyHtmlPath)).toBe(true);
    });

    it('should verify mobile responsive breakpoints in HTML', () => {
      const html = fs.readFileSync(
        path.resolve(__dirname, '../../public/about.html'),
        'utf-8'
      );

      // Check for responsive text sizes
      expect(html).toContain('md:text-4xl');

      // Check for responsive layout
      expect(html).toContain('md:flex-row');

      // Check for container with max-width
      expect(html).toContain('max-w-4xl');
    });
  });
});
