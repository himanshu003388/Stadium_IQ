/**
 * Snapshot Tests
 * Captures rendered output of key components to prevent visual regressions
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarkdownRenderer from '../components/MarkdownRenderer';
import Announcer from '../components/Announcer';
import { FocusTrap } from '../components/FocusTrap';

describe('MarkdownRenderer Snapshot', () => {
  it('matches snapshot with bold text and bullets', () => {
    const { container } = render(
      <MarkdownRenderer text="**Welcome** to Stadium IQ\n• Feature 1\n• Feature 2\nNormal text" />,
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with empty text', () => {
    const { container } = render(<MarkdownRenderer text="" />);
    expect(container.textContent).toBe('');
  });

  it('matches snapshot with single paragraph', () => {
    const { container } = render(<MarkdownRenderer text="Hello world" />);
    expect(container).toMatchSnapshot();
  });
});

describe('Announcer Snapshot', () => {
  it('matches snapshot with default message', () => {
    const { container } = render(<Announcer activeView="command" />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with empty message', () => {
    const { container } = render(<Announcer activeView="" />);
    expect(container).toMatchSnapshot();
  });
});

describe('FocusTrap Snapshot', () => {
  it('matches snapshot when active', () => {
    const { container } = render(
      <FocusTrap active={true}>
        <div>
          <button>First</button>
          <button>Last</button>
        </div>
      </FocusTrap>,
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when inactive', () => {
    const { container } = render(
      <FocusTrap active={false}>
        <div>
          <button>Test</button>
        </div>
      </FocusTrap>,
    );
    expect(container).toMatchSnapshot();
  });
});
