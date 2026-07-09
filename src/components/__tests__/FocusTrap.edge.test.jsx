import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusTrap } from '../FocusTrap';

describe('FocusTrap Edge Cases', () => {
  it('handles single child element', () => {
    render(
      <FocusTrap active={true}>
        <button>Only</button>
      </FocusTrap>,
    );
    expect(screen.getByText('Only')).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByText('Only'));
  });

  it('handles Tab on single element (wraps to same)', () => {
    render(
      <FocusTrap active={true}>
        <button>Only</button>
      </FocusTrap>,
    );
    const btn = screen.getByText('Only');
    btn.focus();
    fireEvent.keyDown(btn, { key: 'Tab' });
    expect(document.activeElement).toBe(btn);
  });

  it('handles Shift+Tab on single element (wraps to same)', () => {
    render(
      <FocusTrap active={true}>
        <button>Only</button>
      </FocusTrap>,
    );
    const btn = screen.getByText('Only');
    btn.focus();
    fireEvent.keyDown(btn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btn);
  });

  it('handles null/undefined children gracefully', () => {
    const { container } = render(<FocusTrap active={true}>{null}</FocusTrap>);
    expect(container).toBeInTheDocument();
  });

  it('handles multiple focusable elements correctly', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <input aria-label="Middle input" />
        <a href="#">Link</a>
        <button>Last</button>
      </FocusTrap>,
    );
    expect(document.activeElement).toBe(screen.getByText('First'));
    const lastBtn = screen.getByText('Last');
    lastBtn.focus();
    fireEvent.keyDown(lastBtn, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('does not trap focus when not active', () => {
    render(
      <FocusTrap active={false}>
        <button>Button</button>
      </FocusTrap>,
    );
    expect(document.activeElement).not.toBe(screen.getByText('Button'));
  });
});
