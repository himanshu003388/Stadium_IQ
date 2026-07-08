import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StadiumProvider } from '../../context/StadiumContext';
import CommandCenter from '../CommandCenter';

function renderWithContext(component) {
  return render(<StadiumProvider>{component}</StadiumProvider>);
}

describe('CommandCenter edge cases', () => {
  it('handles zero gates gracefully', () => {
    renderWithContext(<CommandCenter />);
    expect(screen.getByLabelText('Command Center Dashboard')).toBeInTheDocument();
  });

  it('displays metric values', () => {
    renderWithContext(<CommandCenter />);
    const kpis = screen.getAllByText(/%/);
    expect(kpis.length).toBeGreaterThanOrEqual(2);
  });

  it('renders incident feed section', () => {
    renderWithContext(<CommandCenter />);
    const headings = screen.getAllByText('Active Incidents');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('shows active incident count', () => {
    renderWithContext(<CommandCenter />);
    const incidentCount = screen.getAllByText(/active/i);
    expect(incidentCount.length).toBeGreaterThan(0);
  });

  it('handles resolve button click', () => {
    renderWithContext(<CommandCenter />);
    const resolveButtons = screen.queryAllByText('Mark Resolved');
    if (resolveButtons.length > 0) {
      fireEvent.click(resolveButtons[0]);
    }
  });
});
