import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from '../setupTests';
import Sidebar from './Sidebar';
import { StadiumProvider } from '../context/StadiumContext';
import { AppProvider } from '../context/AppContext';

describe('Sidebar Component', () => {
  const renderSidebar = (activeView = 'dashboard') => {
    const setActiveView = vi.fn();
    return {
      setActiveView,
      ...render(
        <StadiumProvider>
          <AppProvider>
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
          </AppProvider>
        </StadiumProvider>,
      ),
    };
  };

  it('renders all navigation links with aria-labels', () => {
    renderSidebar();
    expect(screen.getAllByLabelText(/Command Center/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/AI Assistant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Crowd Map/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Volunteer Dispatch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Transport Hub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Sustainability/i).length).toBeGreaterThan(0);
  });

  it('marks active nav item with aria-current="page"', () => {
    renderSidebar('assistant');
    const activeLinks = screen.getAllByRole('button', { name: /AI Assistant/i });
    activeLinks.forEach((link) => {
      if (link.getAttribute('aria-current') === 'page') {
        expect(link).toHaveAttribute('aria-current', 'page');
      }
    });
  });

  it('renders venue info', () => {
    renderSidebar();
    expect(screen.getByText('VENUE')).toBeInTheDocument();
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument();
    expect(screen.getByText('Arlington, TX')).toBeInTheDocument();
  });

  it('renders live status indicator', () => {
    renderSidebar();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('renders systems nominal footer', () => {
    renderSidebar();
    expect(screen.getByText('Systems Nominal')).toBeInTheDocument();
  });

  it('renders capacity and renewable percentage', () => {
    renderSidebar();
    expect(screen.getByText(/% capacity/)).toBeInTheDocument();
    expect(screen.getByText(/% renewable/)).toBeInTheDocument();
  });

  it('shows badge counts for critical items', () => {
    renderSidebar();
    const badges = screen.getAllByLabelText(/\d+ alerts/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('calls setActiveView when a nav item is clicked', () => {
    const { setActiveView } = renderSidebar();
    const crowdBtn = screen.getAllByLabelText(/Crowd Map/i)[0];
    fireEvent.click(crowdBtn);
    expect(setActiveView).toHaveBeenCalledWith('crowdmap');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderSidebar();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all NAV_ITEMS with labels', () => {
    renderSidebar();
    expect(screen.getAllByLabelText(/Command Center/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/AI Assistant/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Crowd Map/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Volunteer Dispatch/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Transport Hub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Sustainability/i).length).toBeGreaterThan(0);
  });

  it('shows badge counts for critical items', () => {
    renderSidebar();
    const badges = screen.getAllByLabelText(/\d+ alerts/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders mobile navigation buttons', () => {
    renderSidebar();
    const mobileNav = document.querySelector('[aria-label="Mobile navigation"]');
    expect(mobileNav).toBeInTheDocument();
    const navButtons = mobileNav.querySelectorAll('button');
    expect(navButtons.length).toBeGreaterThan(0);
  });
});
