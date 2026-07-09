/**
 * Integration Tests
 * Tests multiple components working together and full-page accessibility
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { fullAxe } from '../setupTests';
import App from '../App';

describe('Full Application Integration', () => {
  it('loads the complete app with all major sections', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Stadium IQ')).toBeInTheDocument();
    expect(screen.getByText('FIFA World Cup 2026')).toBeInTheDocument();
  });

  it('renders the match details correctly', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('2 - 1')).toBeInTheDocument();
    });
  });

  it('provides skip-to-content link for keyboard users', async () => {
    render(<App />);
    await waitFor(() => {
      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  it('has a proper heading structure with landmarks', async () => {
    render(<App />);
    await waitFor(
      () => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByRole('main')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
    await waitFor(
      () => {
        const regions = document.querySelectorAll('[role="region"]');
        expect(regions.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('passes comprehensive accessibility audit across entire page', async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Crowd Density')).toBeInTheDocument();
    });
    const results = await fullAxe(container);
    expect(results).toHaveNoViolations();
  }, 30000);
});
