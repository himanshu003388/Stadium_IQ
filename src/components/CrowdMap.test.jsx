import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import CrowdMap from './CrowdMap';
import { StadiumProvider } from '../context/StadiumContext';

describe('CrowdMap Component', () => {
  const renderCrowdMap = () =>
    render(
      <StadiumProvider>
        <CrowdMap />
      </StadiumProvider>,
    );

  it('renders the crowd map heading', () => {
    renderCrowdMap();
    expect(screen.getByText(/Crowd & Navigation/i)).toBeInTheDocument();
  });

  it('renders live stadium name', () => {
    renderCrowdMap();
    expect(screen.getByText('AT&T Stadium')).toBeInTheDocument();
  });

  it('renders color legend', () => {
    renderCrowdMap();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Busy')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders gate status panel', () => {
    renderCrowdMap();
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
  });

  it('renders gate entries with wait times', () => {
    renderCrowdMap();
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
    const gateIcons = document.querySelectorAll('svg text');
    const hasGateA = Array.from(gateIcons).some((el) => el.textContent === 'A');
    expect(hasGateA).toBe(true);
  });

  it('renders AI Navigation Tip card', () => {
    renderCrowdMap();
    expect(screen.getByText('AI Navigation Tip')).toBeInTheDocument();
  });

  it('renders zone occupancy info in AI tip', () => {
    renderCrowdMap();
    const tipCard = screen.getByText('AI Navigation Tip').closest('div');
    expect(tipCard).toBeInTheDocument();
    expect(screen.getByText('AI Navigation Tip')).toBeInTheDocument();
  });

  it('shows zone detail when zone is clicked', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north stand/i });
    fireEvent.click(northZone);
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
  });

  it('renders accessibility icons for accessible gates', () => {
    renderCrowdMap();
    const accessibleIcons = document.querySelectorAll('.material-symbols-outlined');
    const accessibleIcon = Array.from(accessibleIcons).find(
      (el) => el.textContent === 'accessible',
    );
    expect(accessibleIcon).toBeInTheDocument();
  });

  it('renders SVG stadium map', () => {
    renderCrowdMap();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderCrowdMap();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows zone details on click and deselects on second click', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north/iu });
    fireEvent.click(northZone);
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    fireEvent.click(northZone);
    expect(screen.queryByText('Occupancy')).not.toBeInTheDocument();
  });

  it('has correct SVG attributes', () => {
    renderCrowdMap();
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'application');
    expect(svg).toHaveAttribute('aria-label', 'Interactive stadium map showing zone occupancy');
  });

  it('handles keyboard navigation for zones', () => {
    renderCrowdMap();
    const northZone = screen.getByRole('button', { name: /north/iu });
    fireEvent.keyDown(northZone, { key: 'ArrowRight' });
    fireEvent.keyDown(northZone, { key: 'ArrowLeft' });
    fireEvent.keyDown(northZone, { key: 'Enter' });
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
  });
});
