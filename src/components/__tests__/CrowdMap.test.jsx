import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import CrowdMap from '../CrowdMap';
import GatePanel from '../crowd-map/GatePanel';
import IndoorNavigation from '../crowd-map/IndoorNavigation';

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('CrowdMap', () => {
  it('renders without crashing', () => {
    renderWithContext(<CrowdMap />);
    expect(screen.getByText('Crowd & Navigation')).toBeInTheDocument();
  });

  it('renders stadium map', () => {
    renderWithContext(<CrowdMap />);
    expect(
      screen.getByLabelText('Interactive stadium map showing zone occupancy'),
    ).toBeInTheDocument();
  });

  it('renders gate status panel', () => {
    renderWithContext(<CrowdMap />);
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
  });

  it('renders AI navigation tip', () => {
    renderWithContext(<CrowdMap />);
    expect(screen.getByText('AI Navigation Tip')).toBeInTheDocument();
  });

  it('renders zone status legend', () => {
    renderWithContext(<CrowdMap />);
    expect(screen.getByLabelText('Zone status legend')).toBeInTheDocument();
  });
});

describe('GatePanel', () => {
  const mockGates = [
    {
      id: 'A',
      direction: 'North',
      density: 0.45,
      waitTimeMinutes: 8,
      status: 'normal',
      accessible: true,
      accessibleFeatures: [],
    },
    {
      id: 'B',
      direction: 'East',
      density: 0.75,
      waitTimeMinutes: 15,
      status: 'watch',
      accessible: false,
      accessibleFeatures: [],
    },
  ];

  it('renders all gates', () => {
    render(<GatePanel gates={mockGates} activeIndoorGate={null} onToggleIndoorNav={() => {}} />);
    expect(screen.getByText('North — 8m wait')).toBeInTheDocument();
    expect(screen.getByText('East — 15m wait')).toBeInTheDocument();
  });

  it('renders navigation links for each gate', () => {
    render(<GatePanel gates={mockGates} activeIndoorGate={null} onToggleIndoorNav={() => {}} />);
    const navLinks = screen.getAllByLabelText(/Navigate to Gate/);
    expect(navLinks.length).toBe(2);
  });

  it('renders indoor navigation button for each gate', () => {
    render(<GatePanel gates={mockGates} activeIndoorGate={null} onToggleIndoorNav={() => {}} />);
    const navButtons = screen.getAllByLabelText(/Show indoor wayfinding/);
    expect(navButtons.length).toBe(2);
  });

  it('highlights active indoor gate button', () => {
    render(<GatePanel gates={mockGates} activeIndoorGate="A" onToggleIndoorNav={() => {}} />);
    const navButton = screen.getByLabelText('Show indoor wayfinding for Gate A');
    expect(navButton).toBeInTheDocument();
  });
});

describe('IndoorNavigation', () => {
  it('renders navigation steps for a gate', () => {
    render(<IndoorNavigation gateId="A" onClose={() => {}} />);
    expect(screen.getByText(/Indoor Navigation from Gate A/)).toBeInTheDocument();
    expect(screen.getByText(/Enter through Gate A/)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<IndoorNavigation gateId="A" onClose={() => {}} />);
    expect(screen.getByLabelText('Close indoor navigation')).toBeInTheDocument();
  });

  it('renders different steps for different gates', () => {
    render(<IndoorNavigation gateId="F" onClose={() => {}} />);
    expect(screen.getByText(/Enter through Gate F/)).toBeInTheDocument();
    expect(screen.getByText(/accessibility ramp/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    let closed = false;
    render(
      <IndoorNavigation
        gateId="A"
        onClose={() => {
          closed = true;
        }}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close indoor navigation'));
    expect(closed).toBe(true);
  });
});
