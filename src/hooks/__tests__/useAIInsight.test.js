/**
 * useAIInsight.js — enhanced branch & function coverage
 * Covers: cache hits, network errors, 403 CSRF refresh, fallback text,
 * loading guard, and clearInsight.
 *
 * NOTE: useAIInsight uses a module-level insightCache that persists between
 * tests. Every requestInsight call must use a UNIQUE prompt string so that
 * cache hits from prior tests do not interfere.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIInsight } from '../useAIInsight';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
let promptCounter = 0;
/** Returns a globally unique prompt string to avoid module-level cache hits. */
function uniquePrompt(base = 'prompt') {
  return `${base}-${++promptCounter}-${Math.random()}`;
}

function makeFetchResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  // Default: CSRF fetch succeeds, chat fetch succeeds
  global.fetch = vi.fn((url) => {
    if (url.includes('csrf-token')) {
      return makeFetchResponse({ csrfToken: 'test-csrf-token' });
    }
    return makeFetchResponse({ reply: 'AI response here' });
  });
});

const MOCK_CTX = {
  stadium: { name: 'Test Stadium', capacity: 50000, currentOccupancy: 30000 },
};

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
      await result.current.requestInsight(uniquePrompt('crowd'), null);
    });
    expect(result.current.insight).toBe('AI response here');
    expect(result.current.isLoading).toBe(false);
  });

  it('does not trigger a second request for the same cached prompt', async () => {
    const prompt = uniquePrompt('cached');
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));

    await act(async () => {
      await result.current.requestInsight(prompt, null);
    });
    const callCount = global.fetch.mock.calls.length;

    // Second call with same prompt — should hit cache
    await act(async () => {
      await result.current.requestInsight(prompt, null);
    });
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
      await result.current.requestInsight(uniquePrompt('network-err'), 'Fallback text');
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
      await result.current.requestInsight(uniquePrompt('network-null'), null);
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
      await result.current.requestInsight(uniquePrompt('csrf-retry'), null);
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
      await result.current.requestInsight(uniquePrompt('csrf-fail'), 'fallback after 403');
    });
    expect(result.current.insight).toBe('fallback after 403');
  });
});

// ─────────────────────────────────────────────
// clearInsight
// ─────────────────────────────────────────────
describe('useAIInsight — clearInsight', () => {
  it('resets insight to null after a successful call', async () => {
    const { result } = renderHook(() => useAIInsight(MOCK_CTX));

    await act(async () => {
      await result.current.requestInsight(uniquePrompt('clear-test'), null);
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

    const { result } = renderHook(() => useAIInsight(MOCK_CTX));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.isLoading).toBe(false);
  });
});
