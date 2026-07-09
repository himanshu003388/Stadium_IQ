import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrefersContrast } from '../usePrefersContrast';

describe('usePrefersContrast', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('returns false by default when contrast is not specified', () => {
    const { result } = renderHook(() => usePrefersContrast());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-contrast: more is set', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-contrast: more)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => usePrefersContrast());
    expect(result.current).toBe(true);
  });

  it('subscribes to media query change events', () => {
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-contrast: more)',
      onchange: null,
      addEventListener,
      removeEventListener: vi.fn(),
    });
    renderHook(() => usePrefersContrast());
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-contrast: more)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener,
    });
    const { unmount } = renderHook(() => usePrefersContrast());
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
