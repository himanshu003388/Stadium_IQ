/**
 * useAIInsight.js — enhanced branch & function coverage
 * Covers: cache hits, network errors, 403 CSRF refresh, fallback text,
 * loading guard, and clearInsight.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIInsight } from '../useAIInsight';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeFetchResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  // Default: CSRF fetch succeeds, chat fetch succeeds
  global.fetch = vi.fn((url) => {
    if (url.includes('csrf-token')) {
      return makeFetchResponse({ csrfToken: 'test-csrf-token' });
    }
    return makeFetchResponse({ reply: 'AI response here' });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_CTX = { stadium: { name: 'Test Stadium', capacity: 50000, currentOccupancy: 30000 } };

// ─────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────
describe('useAIInsight — initialisation', () => {
  it('initializes with null insight', () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    expect(result.current.insight).toBeNull();
  });

  it('initializes with isLoading = false', () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes requestInsight and clearInsight as functions', () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    expect(typeof result.current.requestInsight).toBe('function');
    expect(typeof result.current.clearInsight).toBe('function');
  });
});

// ─────────────────────────────────────────────
// Successful fetch
// ─────────────────────────────────────────────
describe('useAIInsight — successful fetch', () => {
  it('sets insight after a successful API call', async () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await result.current.requestInsight('crowd status', null);
    });
    expect(result.current.insight).toBe('AI response here');
    expect(result.current.isLoading).toBe(false);
  });

  it('does not trigger a second request for the same prompt (cache hit)', async () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));

    await act(async () => {
      await result.current.requestInsight('crowd status', null);
    });
    const callCount = global.fetch.mock.calls.length;

    await act(async () => {
      await result.current.requestInsight('crowd status', null);
    });
    // No additional fetch calls should have been made
    expect(global.fetch.mock.calls.length).toBe(callCount);
    expect(result.current.insight).toBe('AI response here');
  });
});

// ─────────────────────────────────────────────
// Network error → fallback
// ─────────────────────────────────────────────
describe('useAIInsight — network error / fallback', () => {
  it('uses fallback text when fetch throws', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('csrf-token')) return makeFetchResponse({ csrfToken: 'tok' });
      return Promise.reject(new Error('Network error'));
    });

    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await result.current.requestInsight('crowd status', 'Fallback text');
    });
    expect(result.current.insight).toBe('Fallback text');
    expect(result.current.isLoading).toBe(false);
  });

  it('leaves insight null when fetch throws and no fallback given', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('csrf-token')) return makeFetchResponse({ csrfToken: 'tok' });
      return Promise.reject(new Error('Network error'));
    });

    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await result.current.requestInsight('crowd status', null);
    });
    expect(result.current.insight).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 403 CSRF refresh flow
// ─────────────────────────────────────────────
describe('useAIInsight — 403 CSRF refresh', () => {
  it('retries with a new CSRF token after 403, succeeds on retry', async () => {
    let chatCallCount = 0;
    global.fetch = vi.fn((url) => {
      if (url.includes('csrf-token')) return makeFetchResponse({ csrfToken: 'new-csrf' });
      chatCallCount++;
      if (chatCallCount === 1) return makeFetchResponse({}, 403);
      return makeFetchResponse({ reply: 'Retry success' });
    });

    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await result.current.requestInsight('gate info', null);
    });
    expect(result.current.insight).toBe('Retry success');
  });

  it('uses fallback when 403 retry also fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('csrf-token')) return makeFetchResponse({ csrfToken: 'new-csrf' });
      return makeFetchResponse({}, 403);
    });

    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await result.current.requestInsight('gate info', 'fallback after 403');
    });
    expect(result.current.insight).toBe('fallback after 403');
  });
});

// ─────────────────────────────────────────────
// clearInsight
// ─────────────────────────────────────────────
describe('useAIInsight — clearInsight', () => {
  it('resets insight to null', async () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));

    await act(async () => {
      await result.current.requestInsight('some prompt', null);
    });
    expect(result.current.insight).toBe('AI response here');

    act(() => {
      result.current.clearInsight();
    });
    expect(result.current.insight).toBeNull();
  });
});

// ─────────────────────────────────────────────
// CSRF fetch failure on init
// ─────────────────────────────────────────────
describe('useAIInsight — CSRF fetch failure on init', () => {
  it('gracefully handles CSRF fetch failure on mount', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('csrf-token')) return Promise.reject(new Error('CSRF unavailable'));
      return makeFetchResponse({ reply: 'ok' });
    });

    // Should not throw
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    // Small wait for useEffect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.isLoading).toBe(false);
  });
});
