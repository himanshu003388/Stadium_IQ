/**
 * useScrollToBottom — custom hook that scrolls the referenced element into view
 * whenever its dependencies change, respecting the user's prefers-reduced-motion settings.
 *
 * @module useScrollToBottom
 */
import { useEffect } from 'react';

/**
 * Scrolls the referenced element into view when dependencies change.
 *
 * @param {React.RefObject} ref - React ref of the element to scroll to.
 * @param {React.DependencyList} deps - Dependencies that trigger the scroll effect.
 * @returns {void}
 */
export function useScrollToBottom(ref, deps) {
  useEffect(() => {
    const el = ref.current;
    if (el && typeof el.scrollIntoView === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      el.scrollIntoView({ behavior: mq.matches ? 'auto' : 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
