import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGemini } from './useGemini';

global.fetch = vi.fn();

describe('useGemini Hook', () => {
  const mockContext = {
    gates: [
      { id: 'A', density: 0.3, waitTimeMinutes: 5, accessible: true, direction: 'North' },
      { id: 'B', density: 0.8, waitTimeMinutes: 20, accessible: false, direction: 'South' },
    ],
    stadium: {
      name: 'Test Stadium',
      capacity: 105000,
      currentOccupancy: 89250,
      homeTeam: 'Brazil',
      awayTeam: 'France',
      score: '2 - 1',
      matchPhase: "67'",
      weather: { temperature: 32, feelsLike: 35, conditions: 'clear', humidity: 45 },
      sustainability: { co2SavedKg: 14320, renewablePercentage: 94, wasteDiversionRate: 65 },
    },
    incidents: [],
    transportOptions: [
      {
        id: 'TR1',
        type: 'Subway',
        line: 'Red Line',
        etaMinutes: 10,
        co2e: 5,
        capacityLeft: 200,
        recommended: true,
      },
    ],
    tasks: [],
    volunteers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    /**
     * Default mock: CSRF token succeeds, streaming endpoint returns demo-mode 400,
     * fallback /api/chat also returns 400 with API Key missing → triggers demo mode.
     */
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        });
      }
      // Both streaming and non-streaming endpoints return API-key-missing
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'API Key is missing' }),
        body: null, // streaming will fail → falls back to /api/chat
      });
    });
  });

  it('should initialize with welcome message and default language', () => {
    const { result } = renderHook(() => useGemini(mockContext));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('welcome');
    expect(result.current.messages[0].role).toBe('ai');
    expect(result.current.language).toBe('en');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('');
    });

    expect(result.current.messages).toHaveLength(1);
  });

  it('should handle sendMessage in demo mode (no API key)', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    // Demo mode: welcome + user + demo response
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1].role).toBe('user');
    expect(result.current.messages[1].text).toBe('Hello');
    expect(result.current.messages[2].role).toBe('ai');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API error response gracefully', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        });
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });
    });

    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.error).toBe('Could not reach AI service. Please try again.');
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].role).toBe('ai');
    expect(result.current.messages[2].isError).toBe(true);
  });

  it('should handle network errors gracefully', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        });
      return Promise.reject(new Error('Network error'));
    });

    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Test Error');
    });

    expect(result.current.error).toBe('Could not reach AI service. Please try again.');
    expect(result.current.messages[2].isError).toBe(true);
  });

  it('should use demo mode when no API key is set', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Which gate should I enter through?');
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].role).toBe('ai');
    expect(result.current.messages[2].text).toContain('Gate');
    expect(result.current.isLoading).toBe(false);
  });

  it('should update language correctly', () => {
    const { result } = renderHook(() => useGemini(mockContext));

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');

    act(() => {
      result.current.setLanguage('fr');
    });

    expect(result.current.language).toBe('fr');
  });

  it('should generate demo response for gate queries', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Directions to nearest entrance');
    });

    expect(result.current.messages[2].text).toContain('Gate');
  });

  it('should generate demo response for transport queries', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('What is the best transport option?');
    });

    expect(result.current.messages[2].text).toContain('Subway');
  });

  it('should generate demo response for weather queries', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('What is the weather like?');
    });

    expect(result.current.messages[2].text).toContain('32');
  });

  it('should generate demo response for accessibility queries', async () => {
    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Wheelchair accessible entrance?');
    });

    expect(result.current.messages[2].text).toContain('Accessibility');
  });

  it('preserves chat history when language changes', () => {
    const { result } = renderHook(() => useGemini(mockContext));
    const initialCount = result.current.messages.length;
    act(() => {
      result.current.setLanguage('es');
    });
    expect(result.current.messages.length).toBe(initialCount);
    expect(result.current.language).toBe('es');
    act(() => {
      result.current.setLanguage('en');
    });
    expect(result.current.messages.length).toBe(initialCount);
  });

  it('does not send empty messages', async () => {
    const { result } = renderHook(() => useGemini(mockContext));
    await act(async () => {
      await result.current.sendMessage('   ');
    });
    expect(result.current.messages).toHaveLength(1);
  });

  it('does not abort if no active request', () => {
    const { result } = renderHook(() => useGemini(mockContext));
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API success response', async () => {
    fetch.mockImplementation((url) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-token' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reply: 'AI response' }),
      });
    });

    const { result } = renderHook(() => useGemini(mockContext));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(result.current.messages[2].text).toBe('AI response');
  });
});
