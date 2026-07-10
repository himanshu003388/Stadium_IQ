import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import { NotificationProvider } from '../../context/NotificationContext';
import CommandCenter from '../CommandCenter';
import KPICard from '../command-center/KPICard';
import SeverityBadge from '../command-center/SeverityBadge';
import StatusDot from '../command-center/StatusDot';
import GateRow from '../command-center/GateRow';
import IncidentCard from '../command-center/IncidentCard';
import SmartBroadcastWidget from '../command-center/SmartBroadcastWidget';

function renderWithProviders(component) {
  return render(
    <StadiumProvider>
      <NotificationProvider>{component}</NotificationProvider>
    </StadiumProvider>,
  );
}

describe('CommandCenter', () => {
  it('renders dashboard with all KPIs', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.getByText('Crowd Density')).toBeInTheDocument();
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    const activeIncidentsKpis = screen.getAllByText('Active Incidents');
    expect(activeIncidentsKpis.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
  });

  it('renders zone occupancy section', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.getByText('Zone Occupancy')).toBeInTheDocument();
  });

  it('renders gate status section', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.getByText('Gate Status')).toBeInTheDocument();
  });

  it('renders smart broadcast widget', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.getByLabelText('Enter broadcast announcement')).toBeInTheDocument();
  });

  it('renders incident feed', () => {
    renderWithProviders(<CommandCenter />);
    expect(screen.getByLabelText('Incident feed')).toBeInTheDocument();
  });

  it('renders with zero accessibility violations', async () => {
    const { axe } = await import('../../setupTests');
    const { container } = renderWithProviders(<CommandCenter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('KPICard', () => {
  it('renders label, value and unit', () => {
    render(
      <KPICard label="Test KPI" value={42} unit="%" icon="groups" color="#2563eb" delay={1} />,
    );
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <KPICard
        label="Test KPI"
        value={42}
        icon="groups"
        color="#2563eb"
        delay={1}
        sub="subtitle text"
      />,
    );
    expect(screen.getByText('subtitle text')).toBeInTheDocument();
  });

  it('renders without crashing with zero value', () => {
    render(<KPICard label="Empty" value={0} icon="groups" color="#2563eb" delay={1} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(<KPICard label="Status" value="Active" icon="check" color="#16a34a" delay={2} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with aria-live region for screen readers', () => {
    render(<KPICard label="Live" value={99} icon="groups" color="#2563eb" delay={1} />);
    const liveRegion = screen.getByText('99').closest('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });
});

describe('SeverityBadge', () => {
  it('renders with given severity text', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('renders with medium severity', () => {
    render(<SeverityBadge severity="medium" />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders with low severity', () => {
    render(<SeverityBadge severity="low" />);
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('falls back to default badge-info styling if severity is unknown', () => {
    const { container } = render(<SeverityBadge severity="unknown-severity-xyz" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('badge-info');
  });
});

describe('StatusDot', () => {
  it('renders with given status', () => {
    render(<StatusDot status="active" />);
    expect(screen.getByLabelText('Status: active')).toBeInTheDocument();
  });

  it('renders with resolved status', () => {
    render(<StatusDot status="resolved" />);
    expect(screen.getByLabelText('Status: resolved')).toBeInTheDocument();
  });

  it('includes sr-only text for accessibility', () => {
    render(<StatusDot status="active" />);
    expect(screen.getByText('active')).toHaveClass('sr-only');
  });

  it('renders ping animation for non-resolved status', () => {
    const { container } = render(<StatusDot status="active" />);
    const pingElements = container.querySelectorAll('.animate-ping');
    expect(pingElements.length).toBe(1);
  });

  it('does not render ping animation for resolved status', () => {
    const { container } = render(<StatusDot status="resolved" />);
    const pingElements = container.querySelectorAll('.animate-ping');
    expect(pingElements.length).toBe(0);
  });
});

describe('GateRow', () => {
  const mockGate = {
    id: 'A',
    direction: 'North',
    density: 0.45,
    waitTimeMinutes: 8,
    status: 'normal',
    accessible: true,
    accessibleFeatures: ['wheelchair_ramp', 'hearing-loop'],
  };

  it('renders gate id and direction', () => {
    render(<GateRow gate={mockGate} />);
    expect(screen.getByText('Gate A — North')).toBeInTheDocument();
  });

  it('renders wait time', () => {
    render(<GateRow gate={mockGate} />);
    expect(screen.getByText('8m')).toBeInTheDocument();
  });

  it('renders accessibility icon for accessible gates', () => {
    render(<GateRow gate={mockGate} />);
    const accessibleIcons = document.querySelectorAll('.material-symbols-outlined');
    expect(accessibleIcons.length).toBeGreaterThan(0);
  });

  it('renders gate without accessibility features', () => {
    const gateWithoutAccess = { ...mockGate, accessible: false, accessibleFeatures: [] };
    render(<GateRow gate={gateWithoutAccess} />);
    expect(screen.getByText('Gate A — North')).toBeInTheDocument();
  });

  it('highlights wait time in red when above 15 minutes', () => {
    const gateLongWait = { ...mockGate, waitTimeMinutes: 20 };
    render(<GateRow gate={gateLongWait} />);
    const waitEl = screen.getByText('20m');
    expect(waitEl).toHaveStyle('color: var(--color-error)');
  });
});

describe('IncidentCard', () => {
  const mockIncident = {
    id: 'I1',
    severity: 'critical',
    status: 'active',
    type: 'medical',
    timestamp: new Date(),
    description: 'Medical emergency in North Stand',
    aiRecommendedAction: 'Dispatch medical team immediately',
  };

  const mockResolve = vi.fn();

  it('renders incident description', () => {
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={mockIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    expect(screen.getByText('Medical emergency in North Stand')).toBeInTheDocument();
  });

  it('renders AI recommended action', () => {
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={mockIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    expect(screen.getByText('Dispatch medical team immediately')).toBeInTheDocument();
  });

  it('renders severity badge', () => {
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={mockIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('shows dispatch buttons for active incidents', () => {
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={mockIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    expect(screen.getByLabelText('Dispatch Medical Team')).toBeInTheDocument();
    expect(screen.getByLabelText('Dispatch Security Team')).toBeInTheDocument();
  });

  it('calls onResolve when Mark Resolved is clicked', () => {
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={mockIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    fireEvent.click(screen.getByLabelText('Mark incident I1 as resolved'));
    expect(mockResolve).toHaveBeenCalledWith('I1');
  });

  it('resolved incidents do not show action buttons', () => {
    const resolvedIncident = { ...mockIncident, status: 'resolved' };
    render(
      <StadiumProvider>
        <NotificationProvider>
          <IncidentCard incident={resolvedIncident} onResolve={mockResolve} />
        </NotificationProvider>
      </StadiumProvider>,
    );
    expect(screen.queryByLabelText('Dispatch Medical Team')).not.toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });
});

describe('SmartBroadcastWidget', () => {
  it('renders widget header', () => {
    renderWithProviders(<SmartBroadcastWidget />);
    expect(screen.getByText('Smart PA System (GenAI Multilingual Broadcast)')).toBeInTheDocument();
  });

  it('renders textarea for announcement input', () => {
    renderWithProviders(<SmartBroadcastWidget />);
    expect(screen.getByLabelText('Enter broadcast announcement')).toBeInTheDocument();
  });

  it('renders language badges', () => {
    renderWithProviders(<SmartBroadcastWidget />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('JA')).toBeInTheDocument();
    expect(screen.getByText('HI')).toBeInTheDocument();
  });

  it('generate button is disabled when input is empty', () => {
    renderWithProviders(<SmartBroadcastWidget />);
    const button = screen.getByText('Generate & Broadcast');
    expect(button.closest('button')).toBeDisabled();
  });

  it('generate button is enabled when input has text', () => {
    renderWithProviders(<SmartBroadcastWidget />);
    const textarea = screen.getByLabelText('Enter broadcast announcement');
    fireEvent.change(textarea, { target: { value: 'Gate C is closed' } });
    const button = screen.getByText('Generate & Broadcast');
    expect(button.closest('button')).not.toBeDisabled();
  });

  it('calls generate broadcast on click and updates button state', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'API Key is missing' }),
    });
    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    renderWithProviders(<SmartBroadcastWidget />);
    const textarea = screen.getByLabelText('Enter broadcast announcement');
    fireEvent.change(textarea, { target: { value: 'Important broadcast message' } });
    const button = screen.getByRole('button', { name: /Generate & Broadcast/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Broadcast Sent')).toBeInTheDocument();
    
    // Fast-forward 5 seconds to reset the broadcast state
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(screen.queryByText('Broadcast Sent')).not.toBeInTheDocument();
    
    global.fetch = originalFetch;
    vi.useRealTimers();
  });
});
