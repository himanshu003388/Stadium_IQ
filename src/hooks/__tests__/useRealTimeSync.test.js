import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealTimeSync } from '../useRealTimeSync';

// Mock WebSocket implementation for hook testing
class MockWebSocket {
  constructor(url) {
    this.url = url;
    MockWebSocket.instances.push(this);
    this.readyState = 1; // WebSocket.OPEN
    setTimeout(() => {
      if (MockWebSocket.shouldFailHandshake) {
        if (this.onerror) this.onerror(new Error('Handshake failed'));
        if (this.onclose) this.onclose({ code: 4401, reason: 'unauthorized' });
      } else {
        if (this.onopen) this.onopen();
      }
    }, 0);
  }
  send(data) {
    MockWebSocket.sentMessages.push(data);
  }
  close(code, reason) {
    this.readyState = 3; // WebSocket.CLOSED
    this.closed = { code, reason };
    if (this.onclose) this.onclose({ code: code || 1000, reason });
  }
  triggerMessage(data) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }
}

MockWebSocket.instances = [];
MockWebSocket.sentMessages = [];
MockWebSocket.shouldFailHandshake = false;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;

describe('useRealTimeSync hook', () => {
  let mockStore;
  let mockAddNotification;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    MockWebSocket.instances = [];
    MockWebSocket.sentMessages = [];
    MockWebSocket.shouldFailHandshake = false;
    global.WebSocket = MockWebSocket;

    mockStore = {
      getState: vi.fn(() => ({ contextData: {} })),
      setState: vi.fn(),
    };
    mockAddNotification = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-jwt-token' }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch a token and establish a WebSocket connection on mount', async () => {
    const { result } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/token');
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain('token=mock-jwt-token');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle token fetch auth failures and set error without reconnecting', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const { result } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('Authentication failure');
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('should handle WebSocket connection drops and reconnect with exponential backoff', async () => {
    const { result } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate drop
    await act(async () => {
      MockWebSocket.instances[0].close(1006, 'Abnormal closure');
    });

    expect(result.current.isConnected).toBe(false);

    // Reconnect attempt 1 (delay = 1000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500); // not yet
    });
    expect(MockWebSocket.instances.length).toBe(1); // no new instance yet

    await act(async () => {
      vi.advanceTimersByTime(600); // total 1100ms
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(MockWebSocket.instances.length).toBe(2); // reconnected!

    // Simulate drop again
    await act(async () => {
      MockWebSocket.instances[1].close(1006, 'Abnormal closure');
    });

    // Reconnect attempt 2 (delay = 2000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500); // not yet
    });
    expect(MockWebSocket.instances.length).toBe(2);

    await act(async () => {
      vi.advanceTimersByTime(600); // total 2100ms
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(MockWebSocket.instances.length).toBe(3); // reconnected!
  });

  it('should handle authentication failures from the socket server and stop retrying', async () => {
    MockWebSocket.shouldFailHandshake = true;

    const { result } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBe('Authentication failure');

    // Fast-forward time to make sure no reconnection is scheduled
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });

    expect(MockWebSocket.instances.length).toBe(1); // Still only 1 connection attempt
  });

  it('should dispatch actions via WebSocket send', async () => {
    const { result } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    let success;
    act(() => {
      success = result.current.sendAction('TEST_ACTION', { foo: 'bar' });
    });

    expect(success).toBe(true);
    expect(MockWebSocket.sentMessages.length).toBe(1);
    expect(JSON.parse(MockWebSocket.sentMessages[0])).toEqual({
      type: 'ACTION',
      action: 'TEST_ACTION',
      payload: { foo: 'bar' },
    });
  });

  it('should update store state on STATE_UPDATE message', async () => {
    renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const socket = MockWebSocket.instances[0];
    const mockState = { stadium: { name: 'New Name' } };

    act(() => {
      socket.triggerMessage({
        type: 'STATE_UPDATE',
        data: mockState,
      });
    });

    expect(mockStore.setState).toHaveBeenCalled();
  });

  it('should call addNotification on NOTIFICATION message and dispatch event if critical', async () => {
    const listener = vi.fn();
    window.addEventListener('stadium-a11y-announcement', listener);

    renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const socket = MockWebSocket.instances[0];

    // Non-critical notification
    act(() => {
      socket.triggerMessage({
        type: 'NOTIFICATION',
        data: { message: 'Normal notification message', severity: 'normal' },
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Normal notification message',
      severity: 'normal',
    });
    expect(listener).not.toHaveBeenCalled();

    // Critical notification
    act(() => {
      socket.triggerMessage({
        type: 'NOTIFICATION',
        data: { message: 'Critical alert message', severity: 'critical' },
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      message: 'Critical alert message',
      severity: 'critical',
    });
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('stadium-a11y-announcement', listener);
  });

  it('should close socket if component unmounts', async () => {
    const { unmount } = renderHook(() => useRealTimeSync(mockStore, mockAddNotification));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    const socket = MockWebSocket.instances[0];
    const closeSpy = vi.spyOn(socket, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});
