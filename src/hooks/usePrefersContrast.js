import { useState, useEffect } from 'react';

const CONTRAST_QUERY = '(prefers-contrast: more)';

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
