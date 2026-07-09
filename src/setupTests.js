/**
 * Test setup file
 * Configures testing-library matchers, jest-axe, and global mocks
 */
/* eslint-disable no-console */
import '@testing-library/jest-dom';
import { toHaveNoViolations, configureAxe } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Standard axe configuration for component-level unit tests.
 * Page-level rules (document-title, html-has-lang, page-has-heading-one,
 * region, bypass) are disabled because individual components
 * are not full HTML pages and cannot satisfy page-level requirements.
 * These rules ARE tested in integration/page-level tests using `fullAxe`.
 */
const axe = configureAxe({
  rules: {
    'document-title': { enabled: false },
    'html-has-lang': { enabled: false },
    'page-has-heading-one': { enabled: false },
    region: { enabled: false },
    bypass: { enabled: false },
  },
});

/**
 * Full axe configuration with ALL WCAG rules enabled.
 * Use this in integration tests that render complete page contexts
 * (e.g., App.test.jsx, Layout.test.jsx, E2E tests).
 */
const fullAxe = configureAxe();

export { axe, fullAxe };

// Provide proper document context for a11y tests
beforeEach(() => {
  document.title = 'Stadium IQ — FIFA World Cup 2026';
  document.documentElement.setAttribute('lang', 'en');
});

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch for CSRF token
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ csrfToken: 'test-csrf-token' }),
});

// Mock serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
  },
});

// Suppress specific react console errors in tests (standard React test wrapper alerts)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('inside a test was not wrapped in act')) return;
  originalConsoleError(...args);
};
