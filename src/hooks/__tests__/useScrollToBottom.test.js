import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollToBottom } from '../useScrollToBottom';

describe('useScrollToBottom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not crash when element or scrollIntoView is missing', () => {
    const ref = { current: null };
    expect(() => {
      renderHook(({ deps }) => useScrollToBottom(ref, deps), {
        initialProps: { deps: [1] },
      });
    }).not.toThrow();
  });

  it('calls scrollIntoView when dependencies change', () => {
    const scrollIntoView = vi.fn();
    const ref = { current: { scrollIntoView } };

    // Stub matchMedia
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { rerender } = renderHook(({ deps }) => useScrollToBottom(ref, deps), {
      initialProps: { deps: [1] },
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    // Rerender with same deps -> no call
    rerender({ deps: [1] });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // Rerender with different deps -> triggers scroll
    rerender({ deps: [2] });
    expect(scrollIntoView).toHaveBeenCalledTimes(2);

    window.matchMedia = originalMatchMedia;
  });
});
