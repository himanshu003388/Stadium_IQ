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

  it('recovers focus if active element escapes the trap (e.g. unmounted)', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>,
    );

    const first = screen.getByText('First');
    const second = screen.getByText('Second');

    expect(document.activeElement).toBe(first);

    // Focus escapes trap (simulated by focusing body or another element outside)
    const outsideBtn = document.createElement('button');
    document.body.appendChild(outsideBtn);
    outsideBtn.focus();
    expect(document.activeElement).toBe(outsideBtn);

    // Press tab key -> should recover to first
    fireEvent.keyDown(outsideBtn, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    // Shift tab -> should recover to second (last)
    outsideBtn.focus();
    fireEvent.keyDown(outsideBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(second);

    // Clean up
    document.body.removeChild(outsideBtn);
  });
});
