import { useState, useCallback, useRef, useEffect } from 'react';
import { buildSafeContext } from '../utils/helpers';

async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', {
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  return data.csrfToken;
}

export function useAIInsight(contextData) {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const csrfRef = useRef(null);

  useEffect(() => {
    fetchCsrfToken()
      .then((t) => {
        csrfRef.current = t;
      })
      .catch(() => {});
  }, []);

  const requestInsight = useCallback(
    async (prompt, fallback) => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        if (!csrfRef.current) {
          csrfRef.current = await fetchCsrfToken();
        }
        const safeCtx = buildSafeContext(contextData);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfRef.current,
          },
          body: JSON.stringify({
            message: prompt,
            contextData: safeCtx,
            language: 'en',
          }),
          referrerPolicy: 'strict-origin-when-cross-origin',
        });

        if (res.ok) {
          const data = await res.json();
          setInsight(data.reply);
          setIsLoading(false);
          return;
        }

        if (res.status === 403) {
          csrfRef.current = null;
          const newToken = await fetchCsrfToken();
          csrfRef.current = newToken;
          const retryRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': newToken,
            },
            body: JSON.stringify({
              message: prompt,
              contextData: safeCtx,
              language: 'en',
            }),
            referrerPolicy: 'strict-origin-when-cross-origin',
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            setInsight(data.reply);
            setIsLoading(false);
            return;
          }
        }
      } catch {}
      if (fallback) {
        setInsight(fallback);
      }
      setIsLoading(false);
    },
    [contextData, isLoading],
  );

  const clearInsight = useCallback(() => setInsight(null), []);

  return { insight, isLoading, requestInsight, clearInsight };
}
