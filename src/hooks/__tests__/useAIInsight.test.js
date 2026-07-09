import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIInsight } from '../useAIInsight';

vi.mock('../../server/utils/csrf', () => ({
  generateCsrfToken: vi.fn(() => 'test-token'),
}));

describe('useAIInsight', () => {
  const mockContext = {
    stadium: { name: 'Test Stadium' },
  };

  it('initializes with null insight and not loading', () => {
    const { result } = renderHook(() => useAIInsight(mockContext));
    expect(result.current.insight).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('provides requestInsight function', () => {
    const { result } = renderHook(() => useAIInsight(mockContext));
    expect(typeof result.current.requestInsight).toBe('function');
  });

  it('provides clearInsight function', () => {
    const { result } = renderHook(() => useAIInsight(mockContext));
    expect(typeof result.current.clearInsight).toBe('function');
  });

  it('clearInsight resets insight to null', () => {
    const { result } = renderHook(() => useAIInsight(mockContext));
    act(() => {
      result.current.clearInsight();
    });
    expect(result.current.insight).toBeNull();
  });
});
