/**
 * useAIInsight — hook for requesting contextual AI insights on demand.
 *
 * Improvements over the original:
 * 1. 5-minute TTL in-memory cache (keyed by prompt text) prevents redundant
 *    API calls when the same component re-mounts or re-renders.
 * 2. CSRF token is fetched once and reused; refreshed automatically on 403.
 *
 * @module useAIInsight
 * @param {object} contextData - Current stadium context passed to the AI.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { buildSafeContext } from '../utils/helpers';

/** TTL for cached AI insights (5 minutes in milliseconds) */
const INSIGHT_CACHE_TTL = 5 * 60 * 1000;

async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', {
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  return data.csrfToken;
}

/**
 * Module-level cache: Map<prompt, { value: string, expiresAt: number }>
 * Shared across all hook instances to maximise deduplication.
 */
const insightCache = new Map();

function getCached(prompt) {
  const entry = insightCache.get(prompt);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    insightCache.delete(prompt);
    return null;
  }
  return entry.value;
}

function setCached(prompt, value) {
  insightCache.set(prompt, { value, expiresAt: Date.now() + INSIGHT_CACHE_TTL });
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

      // Return cached response immediately if still fresh
      const cached = getCached(prompt);
      if (cached) {
        setInsight(cached);
        return;
      }

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
          setCached(prompt, data.reply);
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
            setCached(prompt, data.reply);
            setInsight(data.reply);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Network error — fall through to fallback
      }
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
