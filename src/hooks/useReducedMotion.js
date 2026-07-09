/**
 * useReducedMotion — custom hook that subscribes to the
 * `(prefers-reduced-motion: reduce)` media query and returns
 * a boolean indicating whether reduced motion is preferred.
 *
 * Using a shared hook avoids prop-drilling `reducedMotion` down
 * through component trees and ensures all components react to the
 * same media query listener.
 *
 * @module useReducedMotion
 * @returns {boolean} `true` when the user prefers reduced motion.
 */
import { useState, useEffect } from 'react';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOTION_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(MOTION_QUERY);
    const handleChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}
