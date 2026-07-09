import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import NotificationToast, { NotificationsContainer } from './NotificationToast';
import { NotificationProvider, useNotifications } from '../context/NotificationContext';

describe('NotificationToast', () => {
  it('renders with critical severity and assertive aria-live', () => {
    render(
      <NotificationToast
        notification={{ id: '1', title: 'Critical', message: 'Emergency!', severity: 'critical' }}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Emergency!')).toBeInTheDocument();
  });

  it('renders with warning severity', () => {
    render(
      <NotificationToast
        notification={{ id: '2', title: 'Warning', message: 'Watch out', severity: 'warning' }}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Watch out')).toBeInTheDocument();
  });

  it('renders with info severity', () => {
    render(
      <NotificationToast
        notification={{ id: '3', title: 'Info', message: 'Just so you know', severity: 'info' }}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('renders with success severity', () => {
    render(
      <NotificationToast
        notification={{ id: '4', title: 'Success', message: 'All good', severity: 'success' }}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <NotificationToast
        notification={{ id: '5', title: 'Test', message: 'Dismiss me', severity: 'info' }}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDismiss).toHaveBeenCalledWith('5');
    vi.useRealTimers();
  });

  it('starts exit animation after 7 seconds', () => {
    vi.useFakeTimers();
    render(
      <NotificationToast
        notification={{ id: '6', title: 'Timed', message: 'Will fade', severity: 'info' }}
        onDismiss={() => {}}
      />,
    );

    const alertDiv = screen.getByRole('alert');
    expect(alertDiv.className).toContain('opacity-100');

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.getByRole('alert').className).toContain('opacity-0');
    vi.useRealTimers();
  });

  it('falls back to info severity when severity is unknown', () => {
    render(
      <NotificationToast
        notification={{ id: '7', title: 'Unknown', message: 'Fallback', severity: 'unknown' }}
        onDismiss={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('NotificationsContainer', () => {
  it('returns null when there are no notifications', () => {
    const { container } = render(
      <NotificationProvider>
        <NotificationsContainer />
      </NotificationProvider>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders with correct aria attributes', () => {
    function Trigger() {
      const { addNotification } = useNotifications();
      React.useEffect(() => {
        addNotification({ title: 'Test', message: 'Message', severity: 'info', autoDismiss: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <NotificationProvider>
        <Trigger />
        <NotificationsContainer />
      </NotificationProvider>,
    );

    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Notifications');
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders all active notifications', () => {
    function Trigger() {
      const { addNotification } = useNotifications();
      React.useEffect(() => {
        addNotification({ title: 'A', message: 'Msg A', severity: 'info', autoDismiss: false });
        addNotification({ title: 'B', message: 'Msg B', severity: 'warning', autoDismiss: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return null;
    }

    render(
      <NotificationProvider>
        <Trigger />
        <NotificationsContainer />
      </NotificationProvider>,
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
