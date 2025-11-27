/**
 * Terms of Service Page Tests
 * Story 4.3: Terms of Service Page
 *
 * Tests comprehensive ToS page structure, legal content, accessibility,
 * and navigation requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Terms of Service Page - Story 4.3', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Load the actual terms.html file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../public/terms.html'),
      'utf-8'
    );
    dom = new JSDOM(html, {
      url: 'http://localhost/terms.html',
      runScripts: 'dangerously',
      resources: 'usable',
    });
    document = dom.window.document;
    window = dom.window as unknown as Window;
  });

  describe('AC1: Page Structure and Metadata', () => {
    it('should have correct page title', () => {
      const title = document.querySelector('title');
      expect(title?.textContent).toContain('Terms of Service');
      expect(title?.textContent).toContain('GTA 6');
    });

    it('should have ToS-focused meta description', () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription?.getAttribute('content')).toContain('Terms of Service');
      expect(metaDescription?.getAttribute('content')).toContain('legal');
    });

    it('should have main heading "Terms of Service"', () => {
      const h1 = document.querySelector('h1');
      expect(h1?.textContent).toContain('Terms of Service');
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

    it('should have all 8 required section links', () => {
      const expectedSections = [
        { text: 'Acceptance of Terms', href: '#acceptance' },
        { text: 'Service Description', href: '#service-description' },
        { text: 'User Conduct', href: '#user-conduct' },
        { text: 'Intellectual Property', href: '#intellectual-property' },
        { text: 'Liability Limitations', href: '#liability-limitations' },
        { text: 'Dispute Resolution', href: '#dispute-resolution' },
        { text: 'Modifications', href: '#modifications' },
        { text: 'Termination', href: '#termination' },
      ];

      const tocLinks = document.querySelectorAll('nav[aria-label="Table of contents"] a');
      expect(tocLinks.length).toBe(8);

      expectedSections.forEach(({ text, href }) => {
        const link = Array.from(tocLinks).find((l) =>
          l.textContent?.includes(text)
        );
        expect(link).toBeTruthy();
        expect(link?.getAttribute('href')).toBe(href);
      });
    });

    it('should have numbered sections in ToC', () => {
      const toc = document.querySelector('nav[aria-label="Table of contents"]');
      const list = toc?.querySelector('ol');
      expect(list).toBeTruthy();
      expect(list?.className).toContain('list-decimal');
    });

    it('should have smooth scroll CSS applied', () => {
      const style = document.querySelector('style');
      expect(style?.textContent).toContain('scroll-behavior');
    });
  });

  describe('AC3: Section 1 - Acceptance of Terms', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#acceptance');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('1.');
      expect(heading).toContain('Acceptance of Terms');
    });

    it('should state agreement by using site', () => {
      const content = section?.textContent || '';
      expect(content).toContain('By');
      expect(content.toLowerCase()).toContain('using');
      expect(content.toLowerCase()).toContain('agree');
      expect(content).toContain('Terms');
    });

    it('should state refusal option (dont use)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('do not agree');
      expect(content).toContain('must not use');
    });

    it('should use clear, enforceable language', () => {
      const content = section?.textContent || '';
      expect(content).toContain('legally binding');
      expect(content).toContain('agree to be bound');
    });
  });

  describe('AC4: Section 2 - Service Description', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#service-description');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('2.');
      expect(heading).toContain('Service Description');
    });

    it('should describe prediction tracking service', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('prediction');
      expect(content).toContain('community');
      expect(content).toContain('GTA 6');
    });

    it('should state "as-is" without warranties', () => {
      const content = section?.textContent || '';
      expect(content).toContain('AS-IS');
      expect(content.toLowerCase()).toContain('without warranties');
    });

    it('should clarify no guarantees about accuracy', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('no');
      expect(content.toLowerCase()).toContain('accuracy');
      expect(content.toLowerCase()).toContain('guarantee');
    });

    it('should state entertainment purposes', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('entertainment');
    });
  });

  describe('AC5: Section 3 - User Conduct', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#user-conduct');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('3.');
      expect(heading).toContain('User Conduct');
    });

    it('should list prohibited activities - spamming', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('spam');
    });

    it('should list prohibited activities - bots', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('bot');
    });

    it('should list prohibited activities - manipulation', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('manipulat');
    });

    it('should list prohibited activities - harassment', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('harass');
    });

    it('should state right to remove predictions', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('remove');
      expect(content.toLowerCase()).toContain('prediction');
    });

    it('should explain consequences of violations', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('consequence');
      expect(content.toLowerCase()).toContain('violation');
    });
  });

  describe('AC6: Section 4 - Intellectual Property', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#intellectual-property');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('4.');
      expect(heading).toContain('Intellectual Property');
    });

    it('should have copyright notice for site content', () => {
      const content = section?.textContent || '';
      expect(content).toContain('2025');
      expect(content).toContain('GTA6Predictions');
      expect(content).toContain('©');
    });

    it('should state user predictions ownership', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('user');
      expect(content.toLowerCase()).toContain('prediction');
      expect(content.toLowerCase()).toContain('retain');
    });

    it('should have fair use disclaimer for GTA 6 trademarks', () => {
      const content = section?.textContent || '';
      expect(content).toContain('fair use');
      expect(content).toContain('Rockstar Games');
      expect(content).toContain('Take-Two Interactive');
    });

    it('should state no affiliation with Rockstar', () => {
      const content = section?.textContent || '';
      expect(content).toContain('not affiliated');
    });
  });

  describe('AC7: Section 5 - Liability Limitations', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#liability-limitations');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('5.');
      expect(heading).toContain('Liability Limitations');
    });

    it('should state entertainment purposes disclaimer', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('entertainment purposes');
    });

    it('should state no liability for inaccuracy', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('not liable');
      expect(content.toLowerCase()).toContain('inaccura');
    });

    it('should state no liability for data loss', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('not liable');
      expect(content.toLowerCase()).toContain('data loss');
    });

    it('should state no liability for service interruptions', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('interruption');
    });

    it('should state maximum liability: $0', () => {
      const content = section?.textContent || '';
      expect(content).toContain('$0');
      expect(content.toLowerCase()).toContain('free service');
    });

    it('should have important legal notice warning', () => {
      const alert = section?.querySelector('.alert');
      expect(alert).toBeTruthy();
      expect(alert?.textContent).toContain('IMPORTANT');
    });
  });

  describe('AC8: Section 6 - Dispute Resolution', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#dispute-resolution');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('6.');
      expect(heading).toContain('Dispute Resolution');
    });

    it('should specify governing law/jurisdiction', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Governing Law');
      expect(content).toContain('California');
    });

    it('should explain informal resolution process', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Informal Resolution');
      expect(content.toLowerCase()).toContain('contact');
    });

    it('should have arbitration clause', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('arbitration');
      expect(content).toContain('binding');
    });

    it('should have class action waiver', () => {
      const content = section?.textContent || '';
      expect(content).toContain('Class Action Waiver');
      expect(content).toContain('WAIVE');
      expect(content.toLowerCase()).toContain('individual capacity');
    });
  });

  describe('AC9: Section 7 - Modifications', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#modifications');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('7.');
      expect(heading).toContain('Modifications');
    });

    it('should state right to update terms', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('modify');
      expect(content.toLowerCase()).toContain('update');
      expect(content).toContain('Terms');
    });

    it('should explain notice requirements', () => {
      const content = section?.textContent || '';
      expect(content).toContain('notice');
      expect(content).toContain('Last Updated');
    });

    it('should state continued use = acceptance', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('continued use');
      expect(content.toLowerCase()).toContain('acceptance');
    });
  });

  describe('AC10: Section 8 - Termination', () => {
    let section: Element | null;

    beforeEach(() => {
      section = document.querySelector('#termination');
    });

    it('should have numbered section heading', () => {
      expect(section).toBeTruthy();
      const heading = section?.querySelector('h2')?.textContent || '';
      expect(heading).toContain('8.');
      expect(heading).toContain('Termination');
    });

    it('should state right to terminate service', () => {
      const content = section?.textContent || '';
      expect(content.toLowerCase()).toContain('terminate');
      expect(content).toContain('Service');
      expect(content.toLowerCase()).toContain('any time');
    });

    it('should explain user data deletion rights', () => {
      const content = section?.textContent || '';
      expect(content).toContain('deletion');
      expect(content.toLowerCase()).toContain('right');
    });

    it('should reference GDPR compliance (30 days)', () => {
      const content = section?.textContent || '';
      expect(content).toContain('30 days');
      expect(content).toContain('GDPR');
    });

    it('should link to deletion form', () => {
      const deletionLink = section?.querySelector('a[href="/delete.html"]');
      expect(deletionLink).toBeTruthy();
    });
  });

  describe('AC11: Page Formatting - Numbered Sections', () => {
    it('should have all 8 sections numbered sequentially', () => {
      const headings = Array.from(document.querySelectorAll('main section h2'));
      const numbers = headings.map((h) => {
        const match = h.textContent?.match(/^(\d+)\./);
        return match ? parseInt(match[1]) : null;
      });

      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('should have clear section structure with IDs', () => {
      const sections = Array.from(document.querySelectorAll('main section[id]'));
      expect(sections.length).toBeGreaterThanOrEqual(8);

      sections.forEach((section) => {
        expect(section.id).toBeTruthy();
        expect(section.querySelector('h2')).toBeTruthy();
      });
    });
  });

  describe('AC12: Footer Navigation', () => {
    it('should have footer with navigation links', () => {
      const footer = document.querySelector('footer nav[aria-label="Footer navigation"]');
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

    it('should have link to Terms of Service (current page)', () => {
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

  describe('AC13: Accessibility (WCAG AA)', () => {
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

    it('should have accessible email links', () => {
      const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
      expect(emailLinks.length).toBeGreaterThan(0);

      emailLinks.forEach((link) => {
        expect(link.textContent).toBeTruthy();
      });
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

  describe('AC14: Mobile Responsiveness', () => {
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

    it('should have responsive text sizes', () => {
      const h1 = document.querySelector('h1');
      expect(h1?.className).toMatch(/text-\d+xl.*md:text-\d+xl/);
    });
  });

  describe('AC15: Cookie Consent Banner Integration', () => {
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

    it('should load cookie-consent.js script', () => {
      const script = document.querySelector('script[src="/js/cookie-consent.js"]');
      expect(script).toBeTruthy();
    });
  });

  describe('AC16: Legal Content Completeness', () => {
    it('should have all 8 required sections present', () => {
      const requiredSections = [
        'acceptance',
        'service-description',
        'user-conduct',
        'intellectual-property',
        'liability-limitations',
        'dispute-resolution',
        'modifications',
        'termination',
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
        'acceptance',
        'service-description',
        'user-conduct',
        'intellectual-property',
        'liability-limitations',
        'dispute-resolution',
        'modifications',
        'termination',
      ]);
    });

    it('should use visual alerts for important notices', () => {
      const alerts = document.querySelectorAll('.alert');
      expect(alerts.length).toBeGreaterThan(0);

      // Should have at least one warning alert for liability
      const warningAlerts = document.querySelectorAll('.alert-warning');
      expect(warningAlerts.length).toBeGreaterThan(0);
    });

    it('should have contact emails for legal and privacy', () => {
      const content = document.body.textContent || '';
      expect(content).toContain('legal@gta6predictions.com');
      expect(content).toContain('privacy@gta6predictions.com');
    });
  });

  describe('AC17: Not Required to Accept Before Use', () => {
    it('should NOT have modal or popup requiring acceptance', () => {
      const modal = document.querySelector('.modal');
      const popup = document.querySelector('[role="dialog"]');

      // Cookie banner is a dialog, but not an acceptance popup
      const banners = document.querySelectorAll('[role="dialog"]');
      banners.forEach((banner) => {
        // Should be cookie consent, not ToS acceptance
        expect(banner.id).toBe('cookie-consent-banner');
      });

      // No ToS acceptance modal should exist
      expect(document.querySelector('#tos-modal')).toBeNull();
      expect(document.querySelector('#accept-terms-button')).toBeNull();
    });

    it('should allow browsing freely without acceptance checkbox', () => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');

      // No acceptance checkboxes should exist
      checkboxes.forEach((checkbox) => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`)?.textContent || '';
        expect(label.toLowerCase()).not.toContain('accept terms');
        expect(label.toLowerCase()).not.toContain('agree to terms');
      });
    });
  });

  describe('AC18: Tailwind CSS Styling Applied', () => {
    it('should link to Tailwind CSS stylesheet', () => {
      const stylesheet = document.querySelector('link[rel="stylesheet"][href="/styles.built.css"]');
      expect(stylesheet).toBeTruthy();
    });

    it('should use Tailwind card components', () => {
      const cards = document.querySelectorAll('.card');
      expect(cards.length).toBeGreaterThan(0);

      cards.forEach((card) => {
        expect(card.className).toContain('bg-base-100');
        expect(card.className).toContain('shadow');
      });
    });

    it('should use Tailwind spacing utilities', () => {
      const sections = document.querySelectorAll('main section');
      sections.forEach((section) => {
        expect(section.className).toMatch(/mb-\d+/);
      });
    });

    it('should use Tailwind typography utilities', () => {
      const headings = document.querySelectorAll('h2, h3');
      headings.forEach((heading) => {
        // Should have either text-size or font-weight utilities
        const hasTypography = heading.className.match(/text-\w+/) || heading.className.match(/font-\w+/);
        expect(hasTypography).toBeTruthy();
      });
    });
  });
});
