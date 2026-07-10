import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Announcer from '../Announcer';

describe('Announcer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a visually hidden aria-live region', () => {
    render(<Announcer activeView="command" />);
    const region = screen.getByRole('status');
    expect(region).toHaveClass('sr-only');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('announces the new view after a delay', () => {
    const { rerender } = render(<Announcer activeView="command" />);

    // Initially empty
    expect(screen.getByRole('status')).toHaveTextContent('');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Command Center');

    // Change route
    rerender(<Announcer activeView="transport" />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Transport Hub');
  });

  it('falls back to Page if view is unknown', () => {
    render(<Announcer activeView="unknown_xyz" />);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Navigated to Page');
  });

  it('updates messages when window receives custom stadium-a11y-announcement event', () => {
    render(<Announcer activeView="command" />);

    // Test polite announcement
    act(() => {
      window.dispatchEvent(
        new CustomEvent('stadium-a11y-announcement', {
          detail: { message: 'Polite reminder message' },
        }),
      );
    });
    expect(screen.getByTestId('route-announcer')).toHaveTextContent('Polite reminder message');

    // Test assertive announcement
    act(() => {
      window.dispatchEvent(
        new CustomEvent('stadium-a11y-announcement', {
          detail: { assertive: true, message: 'Assertive critical alert' },
        }),
      );
    });
    expect(screen.getByTestId('assertive-announcer')).toHaveTextContent('Assertive critical alert');
  });
});
