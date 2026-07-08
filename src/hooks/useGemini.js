import { useState, useCallback, useRef, useEffect } from 'react';
import { getDemoResponse } from '../utils/helpers';

const MAX_MESSAGES = 100;

/**
 * Fetch a CSRF token from the server and cache it
 * @returns {Promise<string>} CSRF token
 */
async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', {
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  return data.csrfToken;
}

export function useGemini(stadiumContext) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: "👋 Hello! I'm **Stadium IQ**, your AI guide for today's match. I can help with:\n• Navigation & gate directions\n• Transport & parking\n• Accessibility assistance\n• Stadium services & amenities\n• Sustainability info\n\nAsk me anything in your language!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const abortRef = useRef(null);
  const csrfTokenRef = useRef(null);
  const contextRef = useRef(stadiumContext);
  const languageRef = useRef(language);
  const isLoadingRef = useRef(false);

  // Keep refs in sync without triggering re-renders
  contextRef.current = stadiumContext;
  languageRef.current = language;
  isLoadingRef.current = isLoading;

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchCsrfToken()
      .then((t) => {
        csrfTokenRef.current = t;
      })
      .catch(() => {
        // Silently handle initial CSRF failure
      });
  }, []);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoadingRef.current) return;
    const sanitized = text.trim().slice(0, 2000);
    if (!sanitized) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: sanitized, timestamp: new Date() };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
    });
    setIsLoading(true);
    setError(null);

    try {
      abortRef.current = new AbortController();

      const body = {
        message: sanitized,
        contextData: contextRef.current,
        language: languageRef.current,
      };
      const headers = { 'Content-Type': 'application/json' };
      if (csrfTokenRef.current) headers['X-CSRF-Token'] = csrfTokenRef.current;

      let res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
        referrerPolicy: 'strict-origin-when-cross-origin',
      });

      if (!res.ok && res.status === 403) {
        csrfTokenRef.current = null;
        const newToken = await fetchCsrfToken();
        csrfTokenRef.current = newToken;
        headers['X-CSRF-Token'] = newToken;
        res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
          referrerPolicy: 'strict-origin-when-cross-origin',
        });
      }

      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch (_e) {}

        if (
          res.status === 400 &&
          errorData.error &&
          errorData.error.includes('API Key is missing')
        ) {
          // Backend missing API key, fallback to demo mode
          await new Promise((r) => setTimeout(r, 1200));
          const demoResponses = getDemoResponse(
            sanitized.toLowerCase(),
            contextRef.current,
            languageRef.current,
          );
          setMessages((prev) => {
            const next = [
              ...prev,
              { id: `ai-${Date.now()}`, role: 'ai', text: demoResponses, timestamp: new Date() },
            ];
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
          });
          setIsLoading(false);
          return;
        }
        throw new Error(errorData.error || `API error ${res.status}`);
      }
      const data = await res.json();
      const aiText = data.reply || 'Sorry, I could not generate a response.';

      setMessages((prev) => {
        const next = [
          ...prev,
          { id: `ai-${Date.now()}`, role: 'ai', text: aiText, timestamp: new Date() },
        ];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Could not reach AI service. Please try again.');
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            role: 'ai',
            text: '⚠️ Unable to connect right now. Please try again.',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, error, language, setLanguage, sendMessage };
}
