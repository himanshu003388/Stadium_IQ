/**
 * App Root Component Tests
 * Covers initial render, BrowserRouter integration, Layout presence,
 * and full-page accessibility audit with ALL WCAG rules enabled.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { fullAxe } from './setupTests';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('renders the main layout header', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  it('renders the main content region', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('renders navigation sidebar', async () => {
    render(<App />);
    await waitFor(() => {
      const navElements = screen.getAllByRole('navigation');
      expect(navElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Command Center by default (first view)', async () => {
    render(<App />);
    await waitFor(
      () => {
        expect(screen.getByText('Crowd Density')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it('renders Occupancy KPI card by default', async () => {
    render(<App />);
    await waitFor(
      () => {
        expect(screen.getByText('Occupancy')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it('renders the AI Active status indicator', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });
  });

  it('renders skip-to-content link', async () => {
    render(<App />);
    await waitFor(() => {
      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).not.toBeNull();
    });
  });

  it('passes full-page accessibility audit with all WCAG rules', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
    const results = await fullAxe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});
