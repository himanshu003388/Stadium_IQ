import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VendorDashboard from './VendorDashboard';
import { axe } from '../setupTests';
import React from 'react';

// Mock the context provider since it has setIntervals we don't want running wild
vi.mock('../context/StadiumContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useStadiumContext: (selector) => {
      const state = {
        contextData: {
          gates: [
            { id: 'A', density: 0.85, direction: 'North' },
            { id: 'B', density: 0.4, direction: 'East' },
          ],
          vendors: [
            { id: 'V1', name: 'Snack A', zone: 'North Stand', stockLevel: 15, status: 'critical' },
            { id: 'V2', name: 'Drink B', zone: 'South Stand', stockLevel: 80, status: 'nominal' },
            { id: 'V3', name: 'Hotdog C', zone: 'North Stand', stockLevel: 45, status: 'warning' },
            { id: 'V4', name: 'Pretzel D', zone: 'East Stand', stockLevel: 49, status: 'unknown' },
          ],
        },
      };
      return selector ? selector(state) : state;
    },
  };
});

describe('VendorDashboard', () => {
  it('renders without crashing and displays heading', () => {
    render(<VendorDashboard />);
    expect(screen.getByText('Smart Concessions & Vendor Support')).toBeInTheDocument();
  });

  it('renders vendor cards correctly', () => {
    render(<VendorDashboard />);
    expect(screen.getByText('Snack A')).toBeInTheDocument();
    expect(screen.getByText('Drink B')).toBeInTheDocument();
    expect(screen.getByText('15% STOCK')).toBeInTheDocument();
    expect(screen.getByText('80% STOCK')).toBeInTheDocument();
  });

  it('displays critical AI supply chain insight for low stock', () => {
    render(<VendorDashboard />);
    expect(screen.getByText(/Immediate restock required/i)).toBeInTheDocument();
  });

  it('displays nominal AI supply chain insight for high stock', () => {
    render(<VendorDashboard />);
    expect(screen.getByText(/Stock levels nominal/i)).toBeInTheDocument();
  });

  it('displays warning AI supply chain insight for moderate stock and high density', () => {
    render(<VendorDashboard />);
    // V3 has 45 stock and is in North Stand (Gate A has 0.85 density)
    expect(screen.getByText(/Pre-emptive restock recommended/i)).toBeInTheDocument();
  });

  it('displays monitoring insight for moderate stock and normal density', () => {
    render(<VendorDashboard />);
    // V4 has 49 stock but is in East Stand (no gate mock, defaults to 0.5 density)
    expect(screen.getByText(/Monitor stock levels/i)).toBeInTheDocument();
  });

  it('handles unknown status with fallback color', () => {
    render(<VendorDashboard />);
    // V4 has 'unknown' status, should still render
    expect(screen.getByText('Pretzel D')).toBeInTheDocument();
    expect(screen.getByText('49% STOCK')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<VendorDashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
