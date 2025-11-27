/**
 * Privacy Policy Page Tests
 * Story 4.2: Privacy Policy Page
 *
 * Tests GDPR-compliant privacy policy page structure, content, accessibility,
 * and navigation requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Privacy Policy Page - Story 4.2', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Load the actual privacy.html file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../public/privacy.html'),
      'utf-8'
    );
    dom = new JSDOM(html, {
      url: 'http://localhost/privacy.html',
      runScripts: 'dangerously',
      resources: 'usable',
    });
    document = dom.window.document;
    window = dom.window as unknown as Window;
  });

  describe('AC1: Page Structure and Metadata', () => {
    it('should have correct page title', () => {
      const title = document.querySelector('title');
      expect(title?.textContent).toContain('Privacy Policy');
      expect(title?.textContent).toContain('GTA 6');
    });

    it('should have privacy-focused meta description', () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toContain('privacy');
      expect(metaDescription?.getAttribute('content')).toContain('GDPR');
    });

    it('should have main heading "Privacy Policy"', () => {
      const h1 = document.querySelector('h1');
      expect(h1?.textContent).toContain('Privacy Policy');
    });

    it('should display last updated date', () => {
      const lastUpdated = document.querySelector('time[datetime]');
      expect(lastUpdated).toBeTruthy();
      expect(lastUpdated?.getAttribute('datetime')).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(lastUpdated?.textContent).toBeTruthy();
    });
  });

  describe('AC2: Table of Contents', () => {
    it('should have table of contents section', () => {
      const toc = document.querySelector('nav[aria-label="Table of contents"]');
      expect(toc).toBeTruthy();
    });

    it('should have all 7 required section links', () => {
      const expectedSections = [
        { text: 'Data Collection', href: '#data-collection' },
        { text: 'Data Usage', href: '#data-usage' },
        { text: 'Data Storage', href: '#data-storage' },
        { text: 'Data Sharing', href: '#data-sharing' },
        { text: 'Your Rights', href: '#your-rights' },
        { text: 'Cookies', href: '#cookies' },
        { text: 'Contact', href: '#contact' },
      ];

      const tocLinks = document.querySelectorAll('nav[aria-label="Table of contents"] a');
      expect(tocLinks.length).toBeGreaterThanOrEqual(7);

      expectedSections.forEach(({ text, href }) => {
        const link = Array.from(tocLinks).find((l) =>
          l.textContent?.includes(text)
        );
        expect(link).toBeTruthy();
        expect(link?.getAttribute('href')).toBe(href);
      });
    });

    it('should have smooth scroll CSS applied', () => {
      const style = document.querySelector('style');
      expect(style?.textContent).toContain('scroll-behavior');
    });
  });

  describe('AC3: Section 1 - Data Collection', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#data-collection');
    });

    it('should have Data Collection section with correct ID', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Data Collection');
    });

    it('should list what data is collected', () => {
      const content = section?.textContent || '';
      expect(content).toContain('prediction date');
      expect(content).toContain('Cookie ID');
      expect(content).toContain('Hashed IP address');
      expect(content).toContain('User agent');
      expect(content).toContain('Timestamps');
    });

    it('should explain how data is collected', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Direct submission');
      expect(content).toContain('Browser cookies');
      expect(content).toContain('Server logs');
    });

    it('should explain why data is collected', () => {
      const content = section?.textContent || '';
      expect(content).toContain('core service');
      expect(content).toContain('spam');
      expect(content).toContain('track');
      expect(content).toContain('analytics');
    });
  });

  describe('AC4: Section 2 - Data Usage', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#data-usage');
    });

    it('should have Data Usage section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Data Usage');
    });

    it('should explain median calculation usage', () => {
      const content = section?.textContent || '';
      expect(content).toContain('median');
      expect(content).toContain('community');
    });

    it('should explain prediction tracking usage', () => {
      const content = (section?.textContent || '').toLowerCase();
      expect(content).toContain('track');
      expect(content).toContain('prediction');
      expect(content).toContain('update');
    });

    it('should explain spam prevention usage', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('spam');
      expect(content.toLowerCase()).toContain('hash');
      expect(content).toContain('IP');
    });

    it('should explain optional analytics usage', () => {
      const content = section?.textContent || '';
      expect(content).toContain('analytics');
      expect(content).toContain('opt out');
    });
  });

  describe('AC5: Section 3 - Data Storage', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#data-storage');
    });

    it('should have Data Storage section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Data Storage');
    });

    it('should specify Cloudflare D1 storage location', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Cloudflare D1');
      expect(content).toContain('United States');
      expect(content).toContain('European Union');
    });

    it('should state retention period for predictions (indefinite)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('indefinitely');
      expect(content).toContain('prediction');
    });

    it('should state retention period for analytics (24 months)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('24 months');
      expect(content).toContain('analytics');
    });

    it('should describe HTTPS security measure', () => {
      const content = section?.textContent || '';
      expect(content).toContain('HTTPS');
      expect(content).toContain('encrypted');
    });

    it('should describe IP hashing security measure', () => {
      const content = section?.textContent || '';
      expect(content).toContain('SHA-256');
      expect(content).toContain('hash');
      expect(content).toContain('salt');
    });

    it('should state no plaintext IPs stored', () => {
      const content = section?.textContent || '';
      expect(content).toContain('never store');
      expect(content).toContain('IP address');
      expect(content).toContain('original form');
    });
  });

  describe('AC6: Section 4 - Data Sharing', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#data-sharing');
    });

    it('should have Data Sharing section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Data Sharing');
    });

    it('should prominently state "We do NOT sell data"', () => {
      const content = section?.textContent || '';
      expect(content).toContain('do NOT sell');
      expect(content).toContain('never sell');
    });

    it('should list Cloudflare as third-party service', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Cloudflare');
      expect(content).toContain('hosting');
    });

    it('should list Google as optional third-party service', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Google');
      expect(content).toContain('optional');
      expect(content).toContain('analytics');
    });

    it('should explain legal compliance sharing', () => {
      const content = section?.textContent || '';
      expect(content).toContain('legal');
      expect(content).toContain('court');
    });
  });

  describe('AC7: Section 5 - Your Rights (GDPR)', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#your-rights');
    });

    it('should have Your Rights section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Your Rights');
      expect(section?.querySelector('h2')?.textContent).toContain('GDPR');
    });

    it('should explain right to access', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Right to Access');
      expect(content).toContain('view your prediction');
    });

    it('should explain right to rectification', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Right to Rectification');
      expect(content).toContain('update');
    });

    it('should explain right to erasure', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Right to Erasure');
      expect(content).toContain('Right to Be Forgotten');
      expect(content).toContain('deletion');
    });

    it('should link to deletion form (Story 4.6)', () => {
      const deletionLink = section?.querySelector('a[href="/delete.html"]');
      expect(deletionLink).toBeTruthy();
      expect(deletionLink?.textContent).toContain('deletion');
    });

    it('should explain right to object (analytics opt-out)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Right to Object');
      expect(content).toContain('opt out');
      expect(content).toContain('analytics');
    });
  });

  describe('AC8: Section 6 - Cookies', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#cookies');
    });

    it('should have Cookies section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Cookies');
    });

    it('should explain functional cookies (gta6_user_id)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('gta6_user_id');
      expect(content).toContain('Functional');
      expect(content).toContain('Required');
    });

    it('should explain cookie_consent cookie', () => {
      const content = section?.textContent || '';
      expect(content).toContain('cookie_consent');
      expect(content).toContain('consent preferences');
    });

    it('should state functional cookie duration (2 years)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('2 years');
    });

    it('should explain analytics cookies as optional', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Analytics');
      expect(content).toContain('Optional');
      expect(content).toContain('_ga');
    });

    it('should state analytics cookie durations', () => {
      const content = section?.textContent || '';
      expect(content).toContain('12 months');
      expect(content).toContain('24 hours');
    });

    it('should explain how to manage cookies', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Functional Only');
      expect(content).toContain('browser');
    });
  });

  describe('AC9: Section 7 - Contact', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#contact');
    });

    it('should have Contact section', () => {
      expect(section).toBeTruthy();
      expect(section?.querySelector('h2')?.textContent).toContain('Contact');
    });

    it('should provide privacy contact email', () => {
      const emailLink = section?.querySelector('a[href^="mailto:"]');
      expect(emailLink).toBeTruthy();
      expect(emailLink?.getAttribute('href')).toContain('privacy@gta6predictions.com');
    });

    it('should state 30-day response time commitment', () => {
      const content = (section?.textContent || '').toLowerCase();
      expect(content).toContain('30 days');
      expect(content).toContain('response');
    });
  });

  describe('AC10: Footer Navigation', () => {
    it('should have footer with navigation links', () => {
      const footer = document.querySelector('footer nav[aria-label="Footer navigation"]');
      expect(footer).toBeTruthy();
    });

    it('should have link to Home', () => {
      const homeLink = document.querySelector('footer a[href="/"]');
      expect(homeLink).toBeTruthy();
      expect(homeLink?.textContent).toContain('Home');
    });

    it('should have link to Privacy Policy (current page)', () => {
      const privacyLink = document.querySelector('footer a[href="/privacy.html"]');
      expect(privacyLink).toBeTruthy();
      expect(privacyLink?.textContent).toContain('Privacy');
    });

    it('should have link to Terms of Service', () => {
      const termsLink = document.querySelector('footer a[href="/terms.html"]');
      expect(termsLink).toBeTruthy();
      expect(termsLink?.textContent).toContain('Terms');
    });

    it('should have link to About page', () => {
      const aboutLink = document.querySelector('footer a[href="/about.html"]');
      expect(aboutLink).toBeTruthy();
      expect(aboutLink?.textContent).toContain('About');
    });
  });

  describe('AC11: Accessibility (WCAG AA)', () => {
    it('should have lang attribute on html element', () => {
      const html = document.querySelector('html');
      expect(html?.getAttribute('lang')).toBe('en');
    });

    it('should have proper heading hierarchy (h1 -> h2 -> h3)', () => {
      const h1 = document.querySelector('h1');
      const h2s = document.querySelectorAll('h2');
      const h3s = document.querySelectorAll('h3');

      expect(h1).toBeTruthy();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should have aria-label on navigation', () => {
      const tocNav = document.querySelector('nav[aria-label="Table of contents"]');
      const footerNav = document.querySelector('nav[aria-label="Footer navigation"]');

      expect(tocNav).toBeTruthy();
      expect(footerNav).toBeTruthy();
    });

    it('should have semantic HTML5 elements', () => {
      expect(document.querySelector('header')).toBeTruthy();
      expect(document.querySelector('nav')).toBeTruthy();
      expect(document.querySelector('main')).toBeTruthy();
      expect(document.querySelector('footer')).toBeTruthy();
      expect(document.querySelectorAll('section').length).toBeGreaterThan(0);
    });

    it('should have time element with datetime attribute', () => {
      const time = document.querySelector('time[datetime]');
      expect(time).toBeTruthy();
      expect(time?.getAttribute('datetime')).toBeTruthy();
    });

    it('should have accessible email link', () => {
      const emailLink = document.querySelector('a[href^="mailto:"]');
      expect(emailLink).toBeTruthy();
      expect(emailLink?.textContent).toBeTruthy();
    });

    it('should have proper list structure for content', () => {
      const lists = document.querySelectorAll('ul, ol');
      expect(lists.length).toBeGreaterThan(0);

      // Check that lists have list items
      lists.forEach((list) => {
        const items = list.querySelectorAll('li');
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AC12: Mobile Responsiveness', () => {
    it('should have viewport meta tag', () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
      expect(viewport?.getAttribute('content')).toContain('width=device-width');
      expect(viewport?.getAttribute('content')).toContain('initial-scale=1.0');
    });

    it('should use responsive Tailwind CSS classes', () => {
      const responsiveElements = document.querySelectorAll('[class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('should have container with max-width', () => {
      const container = document.querySelector('.container');
      expect(container).toBeTruthy();
      expect(container?.className).toContain('max-w');
    });

    it('should have responsive padding/margin', () => {
      const body = document.querySelector('body');
      expect(body?.className).toContain('px-');
      expect(body?.className).toContain('py-');
    });
  });

  describe('AC13: Cookie Consent Banner Integration', () => {
    it('should include cookie consent banner', () => {
      const banner = document.querySelector('#cookie-consent-banner');
      expect(banner).toBeTruthy();
    });

    it('should have link to privacy policy in banner', () => {
      const banner = document.querySelector('#cookie-consent-banner');
      const privacyLink = banner?.querySelector('a[href="/privacy.html"]');
      expect(privacyLink).toBeTruthy();
    });

    it('should have Accept All button', () => {
      const acceptBtn = document.querySelector('#cookie-accept-all');
      expect(acceptBtn).toBeTruthy();
      expect(acceptBtn?.getAttribute('aria-label')).toContain('Accept');
    });

    it('should have Functional Only button', () => {
      const functionalBtn = document.querySelector('#cookie-functional-only');
      expect(functionalBtn).toBeTruthy();
      expect(functionalBtn?.getAttribute('aria-label')).toContain('functional');
    });
  });

  describe('AC14: Plain Language Requirement', () => {
    it('should avoid excessive legal jargon', () => {
      const content = document.querySelector('main')?.textContent || '';

      // Should use plain language explanations
      expect(content).toContain('We use');
      expect(content).toContain('You can');
      expect(content).toContain('We collect');

      // Should avoid overly complex legal terms
      const complexTerms = ['heretofore', 'wherein', 'aforementioned', 'pursuant'];
      complexTerms.forEach((term) => {
        expect(content.toLowerCase()).not.toContain(term);
      });
    });

    it('should have explanatory headings', () => {
      const headings = Array.from(document.querySelectorAll('h3, h4'))
        .map((h) => h.textContent)
        .join(' ');

      expect(headings).toContain('What We Collect');
      expect(headings).toContain('How We Collect');
      expect(headings).toContain('Why We Collect');
    });
  });

  describe('AC15: All 7 Required Sections Present', () => {
    it('should have all 7 required section IDs', () => {
      const requiredSections = [
        'data-collection',
        'data-usage',
        'data-storage',
        'data-sharing',
        'your-rights',
        'cookies',
        'contact',
      ];

      requiredSections.forEach((sectionId) => {
        const section = document.querySelector(`#${sectionId}`);
        expect(section).toBeTruthy();
      });
    });

    it('should have all sections in correct order', () => {
      const sections = Array.from(document.querySelectorAll('main section[id]'));
      const sectionIds = sections.map((s) => s.id);

      expect(sectionIds).toEqual([
        'data-collection',
        'data-usage',
        'data-storage',
        'data-sharing',
        'your-rights',
        'cookies',
        'contact',
      ]);
    });
  });
});
