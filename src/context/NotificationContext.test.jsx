import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationProvider, useNotifications } from './NotificationContext';

const wrapper = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws error when used outside provider', () => {
    const originalError = console.error; // eslint-disable-line no-console
    console.error = () => {}; // eslint-disable-line no-console
    expect(() => renderHook(() => useNotifications())).toThrow(
      'useNotifications must be used within a NotificationProvider',
    );
    console.error = originalError; // eslint-disable-line no-console
  });

  it('starts with empty notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    expect(result.current.notifications).toEqual([]);
  });

  it('adds a notification with correct structure', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({ title: 'Test', message: 'Test message', severity: 'info' });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test');
    expect(result.current.notifications[0].message).toBe('Test message');
    expect(result.current.notifications[0].severity).toBe('info');
    expect(result.current.notifications[0].id).toBeDefined();
    expect(result.current.notifications[0].isNew).toBe(true);
  });

  it('auto-dismisses notification after default duration', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({ title: 'Auto', message: 'Will dismiss', severity: 'info' });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('auto-dismisses notification after custom duration', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({
        title: 'Custom',
        message: 'Custom duration',
        severity: 'warning',
        duration: 3000,
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('does not auto-dismiss when autoDismiss is false', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({
        title: 'Sticky',
        message: 'Stays forever',
        severity: 'info',
        autoDismiss: false,
      });
    });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  it('removes a notification by id', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    let id;
    act(() => {
      id = result.current.addNotification({
        title: 'Remove',
        message: 'To remove',
        severity: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification(id);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({ title: 'A', message: 'Msg A', severity: 'info' });
      result.current.addNotification({ title: 'B', message: 'Msg B', severity: 'warning' });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('caps notifications at 20', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addNotification({
          title: `Notif ${i}`,
          message: `Message ${i}`,
          severity: 'info',
          autoDismiss: false,
        });
      }
    });

    expect(result.current.notifications).toHaveLength(20);
  });

  it('cleans up timers on unmount', () => {
    const { result, unmount } = renderHook(() => useNotifications(), { wrapper });

    act(() => {
      result.current.addNotification({
        title: 'Cleanup',
        message: 'Will be cleaned',
        severity: 'info',
      });
    });

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('generates unique sequential IDs', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    let id1, id2;
    act(() => {
      id1 = result.current.addNotification({
        title: 'A',
        message: 'A',
        severity: 'info',
        autoDismiss: false,
      });
      id2 = result.current.addNotification({
        title: 'B',
        message: 'B',
        severity: 'info',
        autoDismiss: false,
      });
    });

    expect(id1).not.toBe(id2);
  });
});
