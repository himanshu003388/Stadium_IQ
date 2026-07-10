import { useEffect, useRef, useState, useCallback } from 'react';

export function useRealTimeSync(store, addNotification) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isComponentMounted = useRef(true);
  const handleReconnectRef = useRef(null);

  // Helper to fetch the short-lived WebSocket token
  const fetchWSToken = async () => {
    try {
      const res = await fetch('/api/auth/token');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Authentication failure');
        }
        throw new Error('Failed to retrieve sync token');
      }
      const data = await res.json();
      return data.token;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const connect = useCallback(async () => {
    if (!isComponentMounted.current) return;

    // Clear any pending reconnect timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      setError(null);
      const token = await fetchWSToken();
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isComponentMounted.current) {
          socket.close();
          return;
        }
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
      };

      socket.onmessage = (event) => {
        if (!isComponentMounted.current) return;

        try {
          const message = JSON.parse(event.data);

          if (message.type === 'STATE_UPDATE') {
            store.setState((prev) => ({
              ...prev,
              contextData: message.data,
            }));
          } else if (message.type === 'NOTIFICATION') {
            if (addNotification) {
              addNotification(message.data);
            }
            // Trigger accessibility announcement for critical alerts
            if (message.data.severity === 'critical') {
              const alertEvent = new CustomEvent('stadium-a11y-announcement', {
                detail: { message: message.data.message, assertive: true },
              });
              window.dispatchEvent(alertEvent);
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err); // eslint-disable-line no-console
        }
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;

        if (!isComponentMounted.current) return;

        // Check if connection failed due to authorization issues (e.g. status code 4001/4401 or close code)
        if (event.code === 4401 || event.code === 4001 || event.reason === 'unauthorized') {
          setError('Authentication failure');
          return; // Stop reconnecting for authentication failure
        }

        // Trigger reconnect logic with exponential backoff
        if (handleReconnectRef.current) {
          handleReconnectRef.current();
        }
      };

      socket.onerror = (err) => {
        // Socket errors will trigger onclose automatically
        console.error('WebSocket connection error:', err); // eslint-disable-line no-console
      };
    } catch (err) {
      setIsConnected(false);
      if (err.message === 'Authentication failure') {
        setError('Authentication failure');
        return; // Stop reconnecting for authentication failure
      }
      if (handleReconnectRef.current) {
        handleReconnectRef.current();
      }
    }
  }, [store, addNotification]);

  const handleReconnect = useCallback(() => {
    if (!isComponentMounted.current) return;

    const attempts = reconnectAttemptsRef.current;
    // Calculate exponential delay capped at 10 seconds
    const delay = Math.min(10000, 1000 * Math.pow(2, attempts));
    reconnectAttemptsRef.current = attempts + 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  handleReconnectRef.current = handleReconnect;

  useEffect(() => {
    isComponentMounted.current = true;
    connect();

    return () => {
      isComponentMounted.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Decoupled sendAction function for state mutation triggers
  const sendAction = useCallback((action, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'ACTION',
          action,
          payload,
        }),
      );
      return true;
    }
    return false;
  }, []);

  return { isConnected, error, sendAction };
}
