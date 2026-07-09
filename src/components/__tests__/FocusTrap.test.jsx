import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusTrap } from '../FocusTrap';

describe('FocusTrap', () => {
  it('renders children', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Last</button>
      </FocusTrap>,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Last')).toBeInTheDocument();
  });

  it('focuses first element when active', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Last</button>
      </FocusTrap>,
    );
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('does not focus when inactive', () => {
    render(
      <FocusTrap active={false}>
        <button>First</button>
        <button>Last</button>
      </FocusTrap>,
    );
    expect(document.activeElement).not.toBe(screen.getByText('First'));
  });

  it('wraps focus from last to first on Tab', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Last</button>
      </FocusTrap>,
    );
    const lastBtn = screen.getByText('Last');
    lastBtn.focus();
    fireEvent.keyDown(lastBtn, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Last</button>
      </FocusTrap>,
    );
    const firstBtn = screen.getByText('First');
    firstBtn.focus();
    fireEvent.keyDown(firstBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    render(
      <FocusTrap active={true} onEscape={onEscape}>
        <button>First</button>
      </FocusTrap>,
    );
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalled();
  });
});
