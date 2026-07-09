import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'jest-axe';
import Layout from './Layout';

describe('Layout Component', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      'stadium_iq_auth',
      JSON.stringify({
        authenticated: true,
        expiresAt: Date.now() + 3600000,
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'test-token' }),
      }),
    );
  });

  it('renders the app shell without crashing', () => {
    render(<Layout />);
    expect(screen.getByText('Stadium IQ')).toBeInTheDocument();
    expect(screen.getByText('FIFA World Cup 2026')).toBeInTheDocument();
  });

  it('renders navigation', () => {
    render(<Layout />);
    const opsLinks = screen.getAllByLabelText(/Command Center/i);
    expect(opsLinks.length).toBeGreaterThan(0);
    const aiLinks = screen.getAllByLabelText(/AI Assistant/i);
    expect(aiLinks.length).toBeGreaterThan(0);
  });

  it('renders main content area with id for skip-link', () => {
    render(<Layout />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
  });

  it('renders the sidebar', () => {
    render(<Layout />);
    expect(screen.getByText(/VENUE/)).toBeInTheDocument();
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument();
  });

  it('has a skip link with the skip-to-content class', () => {
    render(<Layout />);
    const skipLink = screen.getAllByText('Skip to main content')[0];
    expect(skipLink).toHaveClass('skip-to-content');
  });

  it('updates active view when a nav link is clicked', () => {
    render(<Layout />);
    const aiLink = screen.getAllByLabelText(/AI Assistant/i)[0];
    fireEvent.click(aiLink);
    expect(aiLink).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Layout />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);

  it('renders sidebar navigation links', () => {
    render(<Layout />);
    expect(screen.getAllByLabelText(/Command Center/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Sustainability/i).length).toBeGreaterThan(0);
  });

  it('renders main content area with skip-link target', () => {
    render(<Layout />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('role', 'main');
  });
});
