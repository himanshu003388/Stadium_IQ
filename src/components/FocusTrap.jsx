import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FocusTrap({ children, active, onEscape }) {
  const containerRef = useRef(null);
  const previousActiveRef = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [getFocusableElements, onEscape],
  );

  useEffect(() => {
    if (!active) return;
    previousActiveRef.current = document.activeElement;
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
    return () => {
      if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
        previousActiveRef.current.focus();
      }
    };
  }, [active, getFocusableElements]);

  useEffect(() => {
    if (!active) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, handleKeyDown]);

  return <div ref={containerRef}>{children}</div>;
}

FocusTrap.propTypes = {
  children: PropTypes.node.isRequired,
  active: PropTypes.bool,
  onEscape: PropTypes.func,
};

FocusTrap.defaultProps = {
  active: false,
  onEscape: undefined,
};
