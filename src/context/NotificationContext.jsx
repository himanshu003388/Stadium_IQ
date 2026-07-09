import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const idCounter = useRef(0);
  const timersRef = useRef(new Map());

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addNotification = useCallback((notification) => {
    const id = `notif-${++idCounter.current}`;
    const entry = { id, timestamp: new Date(), ...notification, isNew: true };

    setNotifications((prev) => {
      const next = [entry, ...prev];
      return next.slice(0, 20);
    });

    if (notification.autoDismiss !== false) {
      const duration = notification.duration || 8000;
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeNotification]);

  const clearNotifications = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ notifications, addNotification, removeNotification, clearNotifications }),
    [notifications, addNotification, removeNotification, clearNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
