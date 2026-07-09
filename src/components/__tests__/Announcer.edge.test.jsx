import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Announcer from '../Announcer';

describe('Announcer Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores initial render without announcement', () => {
    render(<Announcer activeView="command" />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('announces after debounce delay', () => {
    render(<Announcer activeView="crowd" />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Crowd & Navigation');
  });

  it('resets debounce on rapid view changes', () => {
    const { rerender } = render(<Announcer activeView="command" />);
    rerender(<Announcer activeView="transport" />);
    rerender(<Announcer activeView="sustain" />);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByRole('status')).toHaveTextContent('');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Sustainability Dashboard');
  });

  it('handles all known view labels', () => {
    const views = {
      command: 'Command Center',
      ai: 'GenAI Assistant',
      crowd: 'Crowd & Navigation',
      volunteers: 'Volunteer Dispatch',
      transport: 'Transport Hub',
      sustain: 'Sustainability Dashboard',
      accessibility: 'Accessibility Hub',
      vendor: 'Vendor Dashboard',
      volunteer_mobile: 'Volunteer Mobile View',
    };

    Object.entries(views).forEach(([view, label]) => {
      const { unmount } = render(<Announcer activeView={view} />);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('status')).toHaveTextContent(`Navigated to ${label}`);
      unmount();
    });
  });

  it('handles undefined view gracefully', () => {
    render(<Announcer activeView={undefined} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Page');
  });

  it('has accessible aria-live region', () => {
    render(<Announcer activeView="command" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveClass('sr-only');
  });
});
