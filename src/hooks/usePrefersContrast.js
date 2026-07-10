/**
 * usePrefersContrast — custom hook that subscribes to the
 * `(prefers-contrast: more)` media query and returns a boolean
 * indicating whether the OS prefers high contrast.
 *
 * @module usePrefersContrast
 */
import { useState, useEffect } from 'react';

const CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * Custom hook to detect high contrast preference.
 *
 * @returns {boolean} `true` if high contrast is preferred.
 */
export function usePrefersContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONTRAST_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(CONTRAST_QUERY);
    const handleChange = (e) => setPrefersHighContrast(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}
