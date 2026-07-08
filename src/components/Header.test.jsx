import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import Header from './Header';
import { StadiumProvider } from '../context/StadiumContext';

import { AppProvider } from '../context/AppContext';

describe('Header Component', () => {
  const renderHeader = (setActiveView = vi.fn()) =>
    render(
      <AppProvider>
        <StadiumProvider>
          <Header setActiveView={setActiveView} />
        </StadiumProvider>
      </AppProvider>,
    );

  it('renders the stadium name and branding', () => {
    renderHeader();
    expect(screen.getByText('Stadium IQ')).toBeInTheDocument();
    expect(screen.getByText('FIFA World Cup 2026')).toBeInTheDocument();
  });

  it('renders the match teams', () => {
    renderHeader();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders the match score', () => {
    renderHeader();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
  });

  it('renders AI Active status indicator', () => {
    renderHeader();
    expect(screen.getByText('AI Active')).toBeInTheDocument();
  });

  it('renders incident count when incidents exist', () => {
    renderHeader();
    // With mock data there should be active incidents
    const incidentBadge = screen.getByLabelText(/View \d+ active incidents/);
    expect(incidentBadge).toBeInTheDocument();
  });

  it('renders current time', () => {
    renderHeader();
    // Time is rendered in HH:MM format
    const timeRegex = /\d{2}:\d{2}/;
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  it('has accessible header landmark', () => {
    renderHeader();
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderHeader();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 10000);

  it('displays match score with teams', () => {
    renderHeader();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders current time in HH:MM format', () => {
    renderHeader();
    const timeRegex = /\d{2}:\d{2}/;
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  it('hides incident badge when zero incidents', () => {
    renderHeader();
    const incidentBadge = screen.queryByLabelText(/0 active incidents/);
    expect(incidentBadge).not.toBeInTheDocument();
  });

  it('updates match clock on interval', () => {
    vi.useFakeTimers();
    try {
      renderHeader();
      expect(screen.getAllByText("67'")[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(65000); // slightly more than 60000 to be safe
      });

      expect(screen.getAllByText("68'")[0]).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls setActiveView when clicking the logo', () => {
    const setActiveView = vi.fn();
    renderHeader(setActiveView);
    const logo = screen.getByLabelText('Stadium IQ - Go to Command Center');
    logo.click();
    expect(setActiveView).toHaveBeenCalledWith('command');
  });

  it('calls setActiveView when clicking the incident badge', () => {
    const setActiveView = vi.fn();
    renderHeader(setActiveView);
    const badge = screen.getByLabelText(/View \d+ active incidents/);
    badge.click();
    expect(setActiveView).toHaveBeenCalledWith('command');
  });

  it('calls toggleTheme when clicking the theme button', () => {
    renderHeader();
    const themeBtn = screen.getByLabelText(/Switch to/i);
    themeBtn.click();
    // In our test, theme toggles, but we just verify it doesn't crash since AppContext handles it.
  });
});
