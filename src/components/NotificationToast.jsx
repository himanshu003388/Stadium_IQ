import React, { memo, useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { COLORS } from '../utils/styles';

const SEVERITY_STYLES = {
  critical: {
    bg: COLORS.gradientCritical,
    icon: 'emergency',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  warning: {
    bg: COLORS.warningContainer,
    icon: 'warning',
    border: `1px solid ${COLORS.warning}`,
    color: COLORS.onWarningContainer,
  },
  info: {
    bg: COLORS.primaryContainer,
    icon: 'info',
    border: `1px solid ${COLORS.primary}`,
    color: COLORS.onPrimaryContainer,
  },
  success: {
    bg: COLORS.successContainer,
    icon: 'check_circle',
    border: `1px solid ${COLORS.success}`,
    color: COLORS.onSuccessContainer,
  },
};

const NotificationToast = memo(function NotificationToast({ notification, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const severity = notification.severity || 'info';
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live={severity === 'critical' ? 'assertive' : 'polite'}
      className={`rounded-xl p-3.5 flex items-start gap-3 shadow-lg transition-all duration-300 ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      style={{
        background: style.bg,
        border: style.border || 'none',
        color: style.color || '#ffffff',
        maxWidth: '380px',
        minWidth: '280px',
      }}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined shrink-0"
        style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}
      >
        {style.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-0.5">{notification.title}</p>
        <p className="text-xs opacity-80">{notification.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <span aria-hidden="true" className="material-symbols-outlined" style={{ fontSize: '14px' }}>
          close
        </span>
      </button>
    </div>
  );
});

export function NotificationsContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-24 right-4 z-[9999] flex flex-col gap-2"
      aria-label="Notifications"
      role="region"
    >
      {notifications.map((n) => (
        <NotificationToast key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
}

export default NotificationToast;
